import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';

type AuthenticatedRequest = Request & {
  user: { id: number; email: string; role: string };
};

describe('ProvidersController', () => {
  let controller: ProvidersController;
  const serviceMock = {
    createForUser: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByUserId: jest.fn(),
    updateOwn: jest.fn(),
    setVerified: jest.fn(),
  };

  const req = {
    user: { id: 5, email: 'test@example.com', role: 'CUSTOMER' },
  } as unknown as AuthenticatedRequest;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProvidersController],
      providers: [{ provide: ProvidersService, useValue: serviceMock }],
    }).compile();

    controller = module.get<ProvidersController>(ProvidersController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('defaults the verified filter to undefined (service applies the default)', async () => {
    await controller.findAll({});
    expect(serviceMock.findAll).toHaveBeenCalledWith(1, 20, undefined);
  });

  it('parses the verified query param', async () => {
    await controller.findAll({}, 'false');
    expect(serviceMock.findAll).toHaveBeenCalledWith(1, 20, false);
  });

  it('creates a provider profile scoped to the caller', async () => {
    await controller.create(req, { bio: 'Electrician' });
    expect(serviceMock.createForUser).toHaveBeenCalledWith(5, {
      bio: 'Electrician',
    });
  });

  it("reads the caller's own profile via /providers/me", async () => {
    await controller.findOwn(req);
    expect(serviceMock.findByUserId).toHaveBeenCalledWith(5);
  });

  it('delegates verify to the service', async () => {
    await controller.verify(1, { verified: true });
    expect(serviceMock.setVerified).toHaveBeenCalledWith(1, true);
  });
});
