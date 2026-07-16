import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  const prismaMock = {
    category: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a category', async () => {
    prismaMock.category.create.mockResolvedValue({ id: 1, name: 'Plumbing' });

    const result = await service.create({ name: 'Plumbing' });

    expect(result).toEqual({ id: 1, name: 'Plumbing' });
  });

  it('excludes soft-deleted categories and returns pagination meta', async () => {
    let capturedWhere: unknown;
    prismaMock.category.findMany.mockImplementation(
      (args: { where: unknown }) => {
        capturedWhere = args.where;
        return Promise.resolve([{ id: 1, name: 'Plumbing' }]);
      },
    );
    prismaMock.category.count.mockResolvedValue(1);

    const result = await service.findAll(1, 20);

    expect(capturedWhere).toEqual({ deletedAt: null });
    expect(result).toEqual({
      data: [{ id: 1, name: 'Plumbing' }],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
  });

  it('throws NotFoundException for a missing category', async () => {
    prismaMock.category.findFirst.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('soft-deletes by setting deletedAt instead of removing the row', async () => {
    prismaMock.category.findFirst.mockResolvedValue({
      id: 1,
      name: 'Plumbing',
    });

    await service.remove(1);

    expect(prismaMock.category.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { deletedAt: expect.any(Date) as Date },
    });
  });
});
