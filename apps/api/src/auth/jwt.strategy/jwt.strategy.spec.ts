import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let provider: JwtStrategy;
  const configMock = {
    get: jest.fn().mockReturnValue('test-jwt-secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    provider = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('maps the JWT payload to a user object', () => {
    const result = provider.validate({
      sub: 1,
      email: 'test@example.com',
      role: 'CUSTOMER',
    });

    expect(result).toEqual({
      id: 1,
      email: 'test@example.com',
      role: 'CUSTOMER',
    });
  });
});
