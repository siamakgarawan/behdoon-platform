import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  const prismaMock = {
    service: {
      findFirst: jest.fn(),
    },
    salon: {
      findFirst: jest.fn(),
    },
    workingHour: {
      findUnique: jest.fn(),
    },
    appointment: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const baseSetup = () => {
      prismaMock.service.findFirst.mockResolvedValue({
        id: 1,
        salonId: 1,
        durationMin: 30,
      });
      prismaMock.salon.findFirst.mockResolvedValue({ id: 1, verified: true });
      prismaMock.workingHour.findUnique.mockResolvedValue({
        salonId: 1,
        weekday: 6, // 2026-08-01 is a Saturday
        startTime: '09:00',
        endTime: '18:00',
      });
    };

    it('rejects a slot outside working hours', async () => {
      baseSetup();

      await expect(
        service.create(5, {
          serviceId: 1,
          startAt: '2026-08-01T20:00:00.000Z',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('rejects a slot on a day the salon has no working hours', async () => {
      prismaMock.service.findFirst.mockResolvedValue({
        id: 1,
        salonId: 1,
        durationMin: 30,
      });
      prismaMock.salon.findFirst.mockResolvedValue({ id: 1, verified: true });
      prismaMock.workingHour.findUnique.mockResolvedValue(null);

      await expect(
        service.create(5, {
          serviceId: 1,
          startAt: '2026-08-01T10:00:00.000Z',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('rejects an overlapping booking', async () => {
      baseSetup();
      prismaMock.appointment.findFirst.mockResolvedValue({ id: 99 });

      await expect(
        service.create(5, {
          serviceId: 1,
          startAt: '2026-08-01T10:00:00.000Z',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates the appointment when the slot is free and in-hours', async () => {
      baseSetup();
      prismaMock.appointment.findFirst.mockResolvedValue(null);
      prismaMock.appointment.create.mockResolvedValue({
        id: 1,
        status: AppointmentStatus.PENDING,
      });

      const result = await service.create(5, {
        serviceId: 1,
        startAt: '2026-08-01T10:00:00.000Z',
      });

      expect(prismaMock.appointment.create).toHaveBeenCalledWith({
        data: {
          customerId: 5,
          salonId: 1,
          serviceId: 1,
          startAt: new Date('2026-08-01T10:00:00.000Z'),
          endAt: new Date('2026-08-01T10:30:00.000Z'),
        },
      });
      expect(result.status).toBe(AppointmentStatus.PENDING);
    });
  });

  describe('getAvailability', () => {
    it('returns an empty list when the salon is closed that day', async () => {
      prismaMock.service.findFirst.mockResolvedValue({
        id: 1,
        salonId: 1,
        durationMin: 30,
      });
      prismaMock.workingHour.findUnique.mockResolvedValue(null);

      const result = await service.getAvailability(1, 1, '2026-08-02');

      expect(result).toEqual([]);
    });

    it('excludes slots that overlap an existing active appointment', async () => {
      prismaMock.service.findFirst.mockResolvedValue({
        id: 1,
        salonId: 1,
        durationMin: 60,
      });
      prismaMock.workingHour.findUnique.mockResolvedValue({
        startTime: '09:00',
        endTime: '11:00',
      });
      prismaMock.appointment.findMany.mockResolvedValue([
        {
          startAt: new Date('2026-08-01T09:00:00.000Z'),
          endAt: new Date('2026-08-01T10:00:00.000Z'),
        },
      ]);

      const result = await service.getAvailability(1, 1, '2026-08-01');

      expect(result).toEqual(['2026-08-01T10:00:00.000Z']);
    });
  });

  describe('ownership', () => {
    it('rejects a caller who is neither the customer nor the salon', async () => {
      prismaMock.appointment.findFirst.mockResolvedValue({
        customerId: 1,
        salon: { userId: 2 },
      });

      await expect(service.findOne(99, 1)).rejects.toThrow(ForbiddenException);
    });

    it('returns 403, not 404, when a caller with no salon tries a salon-only action', async () => {
      prismaMock.appointment.findFirst.mockResolvedValue({
        id: 1,
        salonId: 1,
        status: AppointmentStatus.PENDING,
      });
      prismaMock.salon.findFirst.mockResolvedValue(null);

      await expect(service.confirm(5, 1)).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException for an appointment that does not exist', async () => {
      prismaMock.appointment.findFirst.mockResolvedValue(null);

      await expect(service.confirm(5, 999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('lifecycle guards', () => {
    it('rejects completing an appointment that is not yet CONFIRMED', async () => {
      prismaMock.appointment.findFirst.mockResolvedValue({
        id: 1,
        salonId: 1,
        status: AppointmentStatus.PENDING,
      });
      prismaMock.salon.findFirst.mockResolvedValue({ id: 1 });

      await expect(service.complete(5, 1)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('rejects cancelling a COMPLETED appointment', async () => {
      prismaMock.appointment.findFirst.mockResolvedValue({
        id: 1,
        customerId: 5,
        status: AppointmentStatus.COMPLETED,
        salon: { userId: 2 },
      });

      await expect(service.cancel(5, 1)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('allows confirming a PENDING appointment', async () => {
      prismaMock.appointment.findFirst.mockResolvedValue({
        id: 1,
        salonId: 1,
        status: AppointmentStatus.PENDING,
      });
      prismaMock.salon.findFirst.mockResolvedValue({ id: 1 });
      prismaMock.appointment.update.mockResolvedValue({
        id: 1,
        status: AppointmentStatus.CONFIRMED,
      });

      const result = await service.confirm(5, 1);

      expect(result.status).toBe(AppointmentStatus.CONFIRMED);
    });
  });
});
