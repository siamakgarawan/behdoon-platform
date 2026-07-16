import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AddressesService', () => {
  let service: AddressesService;
  const prismaMock = {
    address: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<AddressesService>(AddressesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('throws NotFoundException for a missing address', async () => {
    prismaMock.address.findUnique.mockResolvedValue(null);

    await expect(service.findOwned(1, 999)).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException when the address belongs to someone else', async () => {
    prismaMock.address.findUnique.mockResolvedValue({ id: 1, userId: 2 });

    await expect(service.findOwned(1, 1)).rejects.toThrow(ForbiddenException);
  });

  it('returns the address when the caller owns it', async () => {
    prismaMock.address.findUnique.mockResolvedValue({ id: 1, userId: 1 });

    await expect(service.findOwned(1, 1)).resolves.toEqual({
      id: 1,
      userId: 1,
    });
  });
});
