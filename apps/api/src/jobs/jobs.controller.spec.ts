import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

type AuthenticatedRequest = Request & {
  user: { id: number; email: string; role: string };
};

describe('JobsController', () => {
  let controller: JobsController;
  const serviceMock = {
    create: jest.fn(),
    findMine: jest.fn(),
    findOne: jest.fn(),
    quote: jest.fn(),
    providerAccept: jest.fn(),
    acceptQuote: jest.fn(),
    schedule: jest.fn(),
    start: jest.fn(),
    complete: jest.fn(),
    pay: jest.fn(),
    cancel: jest.fn(),
    dispute: jest.fn(),
  };

  const req = {
    user: { id: 1, email: 'test@example.com', role: 'CUSTOMER' },
  } as unknown as AuthenticatedRequest;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [{ provide: JobsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<JobsController>(JobsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('scopes create to the caller', async () => {
    const dto = { serviceId: 2, addressId: 3 };
    await controller.create(req, dto);
    expect(serviceMock.create).toHaveBeenCalledWith(1, dto);
  });

  it('scopes findMine to the caller with default pagination', async () => {
    await controller.findMine(req, {});
    expect(serviceMock.findMine).toHaveBeenCalledWith(1, 1, 20);
  });

  it('scopes each lifecycle action to the caller', async () => {
    await controller.quote(req, 5, { amount: 1000 });
    expect(serviceMock.quote).toHaveBeenCalledWith(1, 5, { amount: 1000 });

    await controller.providerAccept(req, 5);
    expect(serviceMock.providerAccept).toHaveBeenCalledWith(1, 5);

    await controller.acceptQuote(req, 5);
    expect(serviceMock.acceptQuote).toHaveBeenCalledWith(1, 5);

    await controller.schedule(req, 5, {
      scheduledAt: '2026-08-01T10:00:00.000Z',
    });
    expect(serviceMock.schedule).toHaveBeenCalledWith(1, 5, {
      scheduledAt: '2026-08-01T10:00:00.000Z',
    });

    await controller.start(req, 5);
    expect(serviceMock.start).toHaveBeenCalledWith(1, 5);

    await controller.complete(req, 5);
    expect(serviceMock.complete).toHaveBeenCalledWith(1, 5);

    await controller.pay(req, 5);
    expect(serviceMock.pay).toHaveBeenCalledWith(1, 5);

    await controller.cancel(req, 5);
    expect(serviceMock.cancel).toHaveBeenCalledWith(1, 5);

    await controller.dispute(req, 5);
    expect(serviceMock.dispute).toHaveBeenCalledWith(1, 5);
  });
});
