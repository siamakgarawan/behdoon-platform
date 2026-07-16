import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ProvidersService } from './providers.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProvidersService', () => {
  let service: ProvidersService;
  const prismaMock = {
    providerProfile: {
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
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProvidersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ProvidersService>(ProvidersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects creating a second provider profile for the same user', async () => {
    prismaMock.providerProfile.findUnique.mockResolvedValue({ id: 1 });

    await expect(service.createForUser(1, {})).rejects.toThrow(
      ConflictException,
    );
  });

  it('creates a provider profile and promotes the user to PROVIDER atomically', async () => {
    prismaMock.providerProfile.findUnique.mockResolvedValue(null);
    prismaMock.$transaction.mockResolvedValue([
      { id: 1, userId: 5, bio: 'Electrician' },
      { id: 5, role: UserRole.PROVIDER },
    ]);

    const result = await service.createForUser(5, { bio: 'Electrician' });

    expect(result).toEqual({ id: 1, userId: 5, bio: 'Electrician' });
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });

  it('only lists verified providers by default', async () => {
    let capturedWhere: unknown;
    prismaMock.providerProfile.findMany.mockImplementation(
      (args: { where: unknown }) => {
        capturedWhere = args.where;
        return Promise.resolve([]);
      },
    );
    prismaMock.providerProfile.count.mockResolvedValue(0);

    await service.findAll(1, 20);

    expect(capturedWhere).toEqual({ deletedAt: null, verified: true });
  });

  it('throws NotFoundException when the caller has no provider profile', async () => {
    prismaMock.providerProfile.findFirst.mockResolvedValue(null);

    await expect(service.findByUserId(99)).rejects.toThrow(NotFoundException);
  });

  it('sets verified via setVerified', async () => {
    prismaMock.providerProfile.findFirst.mockResolvedValue({ id: 1 });
    prismaMock.providerProfile.update.mockResolvedValue({
      id: 1,
      verified: true,
    });

    const result = await service.setVerified(1, true);

    expect(prismaMock.providerProfile.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { verified: true },
    });
    expect(result).toEqual({ id: 1, verified: true });
  });
});
