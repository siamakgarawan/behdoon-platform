import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { SalonsService } from './salons.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SalonsService', () => {
  let service: SalonsService;
  const prismaMock = {
    salon: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
    workingHour: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalonsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<SalonsService>(SalonsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects creating a second salon profile for the same user', async () => {
    prismaMock.salon.findUnique.mockResolvedValue({ id: 1 });

    await expect(
      service.createForUser(1, {
        name: 'Salon',
        city: 'Tehran',
        address: 'Somewhere',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('creates a salon and promotes the user to PROVIDER atomically', async () => {
    prismaMock.salon.findUnique.mockResolvedValue(null);
    prismaMock.$transaction.mockResolvedValue([
      { id: 1, userId: 5, name: 'Salon' },
      { id: 5, role: 'PROVIDER' },
    ]);

    const result = await service.createForUser(5, {
      name: 'Salon',
      city: 'Tehran',
      address: 'Somewhere',
    });

    expect(result).toEqual({ id: 1, userId: 5, name: 'Salon' });
  });

  it('only lists verified salons by default', async () => {
    let capturedWhere: unknown;
    prismaMock.salon.findMany.mockImplementation((args: { where: unknown }) => {
      capturedWhere = args.where;
      return Promise.resolve([]);
    });
    prismaMock.salon.count.mockResolvedValue(0);

    await service.findAll(1, 20);

    expect(capturedWhere).toEqual({ deletedAt: null, verified: true });
  });

  it('filters by city when provided', async () => {
    let capturedWhere: unknown;
    prismaMock.salon.findMany.mockImplementation((args: { where: unknown }) => {
      capturedWhere = args.where;
      return Promise.resolve([]);
    });
    prismaMock.salon.count.mockResolvedValue(0);

    await service.findAll(1, 20, 'Tehran');

    expect(capturedWhere).toEqual({
      deletedAt: null,
      verified: true,
      city: 'Tehran',
    });
  });

  it('throws NotFoundException when the caller has no salon profile', async () => {
    prismaMock.salon.findFirst.mockResolvedValue(null);

    await expect(service.findByUserId(99)).rejects.toThrow(NotFoundException);
  });

  it('rejects duplicate weekdays in working hours', async () => {
    prismaMock.salon.findFirst.mockResolvedValue({ id: 1 });

    await expect(
      service.setWorkingHours(1, {
        hours: [
          { weekday: 0, startTime: '09:00', endTime: '18:00' },
          { weekday: 0, startTime: '10:00', endTime: '17:00' },
        ],
      }),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('replaces working hours in a transaction', async () => {
    prismaMock.salon.findFirst.mockResolvedValue({ id: 1 });
    prismaMock.workingHour.findMany.mockResolvedValue([
      { id: 1, salonId: 1, weekday: 0, startTime: '09:00', endTime: '18:00' },
    ]);

    const result = await service.setWorkingHours(1, {
      hours: [{ weekday: 0, startTime: '09:00', endTime: '18:00' }],
    });

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });
});
