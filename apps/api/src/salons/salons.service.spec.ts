import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
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
    salonPhoto: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    review: {
      groupBy: jest.fn(),
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

  it('attaches a rating summary to each salon in findAll', async () => {
    prismaMock.salon.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    prismaMock.salon.count.mockResolvedValue(2);
    prismaMock.review.groupBy.mockResolvedValue([
      { salonId: 1, _avg: { rating: 4.5 }, _count: { rating: 2 } },
    ]);

    const result = await service.findAll(1, 20);

    expect(result.data).toEqual([
      { id: 1, rating: { average: 4.5, count: 2 } },
      { id: 2, rating: { average: null, count: 0 } },
    ]);
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

  it("adds a photo to the caller's own salon", async () => {
    prismaMock.salon.findFirst.mockResolvedValue({ id: 1 });
    prismaMock.salonPhoto.create.mockResolvedValue({
      id: 9,
      salonId: 1,
      url: 'https://x/y.jpg',
    });

    const result = await service.addPhoto(5, { url: 'https://x/y.jpg' });

    expect(prismaMock.salonPhoto.create).toHaveBeenCalledWith({
      data: { salonId: 1, url: 'https://x/y.jpg' },
    });
    expect(result).toEqual({ id: 9, salonId: 1, url: 'https://x/y.jpg' });
  });

  it('rejects removing a photo owned by a different salon', async () => {
    prismaMock.salon.findFirst.mockResolvedValue({ id: 1 });
    prismaMock.salonPhoto.findFirst.mockResolvedValue({ id: 9, salonId: 99 });

    await expect(service.removePhoto(5, 9)).rejects.toThrow(ForbiddenException);
  });

  it('throws NotFoundException when removing a photo that does not exist', async () => {
    prismaMock.salon.findFirst.mockResolvedValue({ id: 1 });
    prismaMock.salonPhoto.findFirst.mockResolvedValue(null);

    await expect(service.removePhoto(5, 999)).rejects.toThrow(
      NotFoundException,
    );
  });

  it("removes a photo owned by the caller's salon", async () => {
    prismaMock.salon.findFirst.mockResolvedValue({ id: 1 });
    prismaMock.salonPhoto.findFirst.mockResolvedValue({ id: 9, salonId: 1 });

    await service.removePhoto(5, 9);

    expect(prismaMock.salonPhoto.delete).toHaveBeenCalledWith({
      where: { id: 9 },
    });
  });
});
