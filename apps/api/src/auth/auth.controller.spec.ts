import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates register to AuthService', async () => {
    const dto: RegisterDto = {
      name: 'Test',
      email: 'test@example.com',
      password: 'secret1',
    };

    await controller.register(dto);

    expect(authServiceMock.register).toHaveBeenCalledWith(dto);
  });

  it('delegates login to AuthService', async () => {
    const dto: LoginDto = { email: 'test@example.com', password: 'secret1' };

    await controller.login(dto);

    expect(authServiceMock.login).toHaveBeenCalledWith(dto);
  });
});
