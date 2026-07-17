import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { SalonsController } from './salons.controller';
import { SalonsService } from './salons.service';

type AuthenticatedRequest = Request & {
  user: { id: number; email: string; role: string };
};

describe('SalonsController', () => {
  let controller: SalonsController;
  const serviceMock = {
    createForUser: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByUserId: jest.fn(),
    updateOwn: jest.fn(),
    setVerified: jest.fn(),
    setWorkingHours: jest.fn(),
  };

  const req = {
    user: { id: 5, email: 'test@example.com', role: 'CUSTOMER' },
  } as unknown as AuthenticatedRequest;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalonsController],
      providers: [{ provide: SalonsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<SalonsController>(SalonsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('defaults pagination and omits city when not given', async () => {
    await controller.findAll({});
    expect(serviceMock.findAll).toHaveBeenCalledWith(1, 20, undefined);
  });

  it('passes city through', async () => {
    await controller.findAll({}, 'Tehran');
    expect(serviceMock.findAll).toHaveBeenCalledWith(1, 20, 'Tehran');
  });

  it('creates a salon scoped to the caller', async () => {
    const dto = { name: 'Salon', city: 'Tehran', address: 'Somewhere' };
    await controller.create(req, dto);
    expect(serviceMock.createForUser).toHaveBeenCalledWith(5, dto);
  });

  it("reads the caller's own salon via /salons/me", async () => {
    await controller.findOwn(req);
    expect(serviceMock.findByUserId).toHaveBeenCalledWith(5);
  });

  it('scopes working hours to the caller', async () => {
    const dto = {
      hours: [{ weekday: 0, startTime: '09:00', endTime: '18:00' }],
    };
    await controller.setWorkingHours(req, dto);
    expect(serviceMock.setWorkingHours).toHaveBeenCalledWith(5, dto);
  });

  it('delegates verify to the service', async () => {
    await controller.verify(1, { verified: true });
    expect(serviceMock.setVerified).toHaveBeenCalledWith(1, true);
  });
});
