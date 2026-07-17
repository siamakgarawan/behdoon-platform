import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ServicesService', () => {
  let service: ServicesService;
  const prismaMock = {
    service: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    salon: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it("creates a service scoped to the caller's salon", async () => {
    prismaMock.salon.findFirst.mockResolvedValue({ id: 7 });

    let capturedSalonId: number | undefined;
    prismaMock.service.create.mockImplementation(
      (args: { data: { salonId: number } }) => {
        capturedSalonId = args.data.salonId;
        return Promise.resolve({ id: 1, salonId: args.data.salonId });
      },
    );

    const result = await service.create(3, {
      title: 'کوتاهی مو',
      price: 500000,
      durationMin: 30,
      categoryId: 1,
    });

    expect(capturedSalonId).toBe(7);
    expect(result).toEqual({ id: 1, salonId: 7 });
  });

  it('throws NotFoundException when the caller has no salon', async () => {
    prismaMock.salon.findFirst.mockResolvedValue(null);

    await expect(
      service.create(3, {
        title: 'کوتاهی مو',
        price: 500000,
        durationMin: 30,
        categoryId: 1,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('only lists services from verified salons', async () => {
    let capturedWhere: unknown;
    prismaMock.service.findMany.mockImplementation(
      (args: { where: unknown }) => {
        capturedWhere = args.where;
        return Promise.resolve([]);
      },
    );
    prismaMock.service.count.mockResolvedValue(0);

    await service.findAll(1, 20);

    expect(capturedWhere).toEqual({
      deletedAt: null,
      salon: { verified: true },
    });
  });

  it('rejects updating a service owned by a different salon', async () => {
    prismaMock.service.findFirst.mockResolvedValue({ id: 1, salonId: 99 });
    prismaMock.salon.findFirst.mockResolvedValue({ id: 7 });

    await expect(service.update(3, 1, { title: 'x' })).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('throws NotFoundException for a service that does not exist', async () => {
    prismaMock.service.findFirst.mockResolvedValue(null);

    await expect(service.update(3, 999, { title: 'x' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('returns 403, not 404, when the caller has no salon at all', async () => {
    prismaMock.service.findFirst.mockResolvedValue({ id: 1, salonId: 7 });
    prismaMock.salon.findFirst.mockResolvedValue(null);

    await expect(service.update(3, 1, { title: 'x' })).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('allows the owning salon to update its own service', async () => {
    prismaMock.service.findFirst.mockResolvedValue({ id: 1, salonId: 7 });
    prismaMock.salon.findFirst.mockResolvedValue({ id: 7 });
    prismaMock.service.update.mockResolvedValue({ id: 1, title: 'Updated' });

    const result = await service.update(3, 1, { title: 'Updated' });

    expect(result).toEqual({ id: 1, title: 'Updated' });
  });
});
