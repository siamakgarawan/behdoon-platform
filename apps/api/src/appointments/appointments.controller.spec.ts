import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

type AuthenticatedRequest = Request & {
  user: { id: number; email: string; role: string };
};

describe('AppointmentsController', () => {
  let controller: AppointmentsController;
  const serviceMock = {
    create: jest.fn(),
    getAvailability: jest.fn(),
    findMine: jest.fn(),
    findOne: jest.fn(),
    confirm: jest.fn(),
    complete: jest.fn(),
    noShow: jest.fn(),
    cancel: jest.fn(),
  };

  const req = {
    user: { id: 1, email: 'test@example.com', role: 'CUSTOMER' },
  } as unknown as AuthenticatedRequest;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [{ provide: AppointmentsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<AppointmentsController>(AppointmentsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('reads availability without requiring a request user', () => {
    void controller.getAvailability(1, 2, '2026-08-01');
    expect(serviceMock.getAvailability).toHaveBeenCalledWith(
      1,
      2,
      '2026-08-01',
    );
  });

  it('scopes create to the caller', async () => {
    const dto = { serviceId: 2, startAt: '2026-08-01T10:00:00.000Z' };
    await controller.create(req, dto);
    expect(serviceMock.create).toHaveBeenCalledWith(1, dto);
  });

  it('scopes findMine to the caller with default pagination', async () => {
    await controller.findMine(req, {});
    expect(serviceMock.findMine).toHaveBeenCalledWith(1, 1, 20);
  });

  it('scopes each lifecycle action to the caller', async () => {
    await controller.confirm(req, 5);
    expect(serviceMock.confirm).toHaveBeenCalledWith(1, 5);

    await controller.complete(req, 5);
    expect(serviceMock.complete).toHaveBeenCalledWith(1, 5);

    await controller.noShow(req, 5);
    expect(serviceMock.noShow).toHaveBeenCalledWith(1, 5);

    await controller.cancel(req, 5);
    expect(serviceMock.cancel).toHaveBeenCalledWith(1, 5);
  });
});
