import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PriceType } from '@prisma/client';
import { ServicesService } from './services.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProvidersService } from '../providers/providers.service';

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
  };
  const providersServiceMock = {
    findByUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ProvidersService, useValue: providersServiceMock },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it("creates a service scoped to the caller's provider profile", async () => {
    let capturedProviderId: number | undefined;
    providersServiceMock.findByUserId.mockResolvedValue({ id: 7 });
    prismaMock.service.create.mockImplementation(
      (args: { data: { providerId: number } }) => {
        capturedProviderId = args.data.providerId;
        return Promise.resolve({ id: 1, providerId: args.data.providerId });
      },
    );

    const result = await service.create(3, {
      title: 'Leak repair',
      priceType: PriceType.FIXED,
      price: 500000,
      categoryId: 1,
    });

    expect(capturedProviderId).toBe(7);
    expect(result).toEqual({ id: 1, providerId: 7 });
  });

  it('only lists services from verified providers', async () => {
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
      provider: { verified: true },
    });
  });

  it('filters by categoryId when provided', async () => {
    let capturedWhere: unknown;
    prismaMock.service.findMany.mockImplementation(
      (args: { where: unknown }) => {
        capturedWhere = args.where;
        return Promise.resolve([]);
      },
    );
    prismaMock.service.count.mockResolvedValue(0);

    await service.findAll(1, 20, 4);

    expect(capturedWhere).toEqual({
      deletedAt: null,
      provider: { verified: true },
      categoryId: 4,
    });
  });

  it('rejects updating a service owned by a different provider', async () => {
    providersServiceMock.findByUserId.mockResolvedValue({ id: 7 });
    prismaMock.service.findFirst.mockResolvedValue({ id: 1, providerId: 99 });

    await expect(service.update(3, 1, { title: 'x' })).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('throws NotFoundException when the service does not exist', async () => {
    providersServiceMock.findByUserId.mockResolvedValue({ id: 7 });
    prismaMock.service.findFirst.mockResolvedValue(null);

    await expect(service.update(3, 999, { title: 'x' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('allows the owning provider to update their own service', async () => {
    providersServiceMock.findByUserId.mockResolvedValue({ id: 7 });
    prismaMock.service.findFirst.mockResolvedValue({ id: 1, providerId: 7 });
    prismaMock.service.update.mockResolvedValue({ id: 1, title: 'Updated' });

    const result = await service.update(3, 1, { title: 'Updated' });

    expect(result).toEqual({ id: 1, title: 'Updated' });
  });
});
