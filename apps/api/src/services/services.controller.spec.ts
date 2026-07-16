import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { PriceType } from '@prisma/client';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

type AuthenticatedRequest = Request & {
  user: { id: number; email: string; role: string };
};

describe('ServicesController', () => {
  let controller: ServicesController;
  const serviceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findMine: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const req = {
    user: { id: 3, email: 'test@example.com', role: 'PROVIDER' },
  } as unknown as AuthenticatedRequest;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [{ provide: ServicesService, useValue: serviceMock }],
    }).compile();

    controller = module.get<ServicesController>(ServicesController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('defaults pagination and omits categoryId when not given', async () => {
    await controller.findAll({});
    expect(serviceMock.findAll).toHaveBeenCalledWith(1, 20, undefined);
  });

  it('parses categoryId from the query string', async () => {
    await controller.findAll({}, '4');
    expect(serviceMock.findAll).toHaveBeenCalledWith(1, 20, 4);
  });

  it('creates a service scoped to the caller', async () => {
    await controller.create(req, {
      title: 'Leak repair',
      priceType: PriceType.FIXED,
      price: 500000,
      categoryId: 1,
    });

    expect(serviceMock.create).toHaveBeenCalledWith(
      3,
      expect.objectContaining({ title: 'Leak repair' }),
    );
  });

  it('scopes findMine to the caller', async () => {
    await controller.findMine(req);
    expect(serviceMock.findMine).toHaveBeenCalledWith(3);
  });

  it('scopes update to the caller', async () => {
    await controller.update(req, 1, { title: 'Updated' });
    expect(serviceMock.update).toHaveBeenCalledWith(3, 1, {
      title: 'Updated',
    });
  });

  it('scopes remove to the caller', async () => {
    await controller.remove(req, 1);
    expect(serviceMock.remove).toHaveBeenCalledWith(3, 1);
  });
});
