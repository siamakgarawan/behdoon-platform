import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  const serviceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: CategoriesService, useValue: serviceMock }],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('defaults to page 1 / limit 20 when listing', async () => {
    await controller.findAll({});
    expect(serviceMock.findAll).toHaveBeenCalledWith(1, 20);
  });

  it('passes explicit pagination through', async () => {
    await controller.findAll({ page: 3, limit: 10 });
    expect(serviceMock.findAll).toHaveBeenCalledWith(3, 10);
  });

  it('delegates create to the service', async () => {
    await controller.create({ name: 'Plumbing' });
    expect(serviceMock.create).toHaveBeenCalledWith({ name: 'Plumbing' });
  });
});
