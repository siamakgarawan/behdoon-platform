import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

describe('AuthController', () => {
  let controller: AuthController;
  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    requestOtp: jest.fn(),
    verifyOtp: jest.fn(),
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

  it('delegates refresh to AuthService', async () => {
    const dto: RefreshDto = { refreshToken: 'some-token' };

    await controller.refresh(dto);

    expect(authServiceMock.refresh).toHaveBeenCalledWith('some-token');
  });

  it('delegates logout to AuthService', async () => {
    const dto: RefreshDto = { refreshToken: 'some-token' };

    await controller.logout(dto);

    expect(authServiceMock.logout).toHaveBeenCalledWith('some-token');
  });

  it('delegates otp/request to AuthService', async () => {
    const dto: RequestOtpDto = { phone: '+989121234567' };

    await controller.requestOtp(dto);

    expect(authServiceMock.requestOtp).toHaveBeenCalledWith('+989121234567');
  });

  it('delegates otp/verify to AuthService', async () => {
    const dto: VerifyOtpDto = { phone: '+989121234567', code: '123456' };

    await controller.verifyOtp(dto);

    expect(authServiceMock.verifyOtp).toHaveBeenCalledWith(
      '+989121234567',
      '123456',
    );
  });
});
