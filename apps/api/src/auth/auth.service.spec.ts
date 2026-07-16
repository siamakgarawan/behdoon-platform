import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

describe('AuthService', () => {
  let service: AuthService;
  const prismaMock = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };
  const jwtServiceMock = {
    sign: jest.fn().mockReturnValue('signed.jwt.token'),
  };
  const redisClientMock = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };
  const redisServiceMock = {
    getClient: jest.fn().mockReturnValue(redisClientMock),
  };
  const configServiceMock = {
    get: jest.fn().mockReturnValue('30'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: RedisService, useValue: redisServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('hashes the password and never returns it from register', async () => {
    let capturedPassword = '';
    prismaMock.user.create.mockImplementation(
      (args: { data: { name: string; email: string; password: string } }) => {
        capturedPassword = args.data.password;
        return Promise.resolve({
          id: 1,
          role: 'CUSTOMER',
          createdAt: new Date('2026-01-01'),
          ...args.data,
        });
      },
    );

    const result = await service.register({
      name: 'Test',
      email: 'test@example.com',
      password: 'plaintext',
    });

    expect(result).not.toHaveProperty('password');
    expect(capturedPassword).not.toBe('plaintext');
    expect(await bcrypt.compare('plaintext', capturedPassword)).toBe(true);
  });

  it('rejects login for a non-existent user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@example.com', password: 'whatever' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects login for a wrong password', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      password: await bcrypt.hash('correct-password', 10),
      role: 'CUSTOMER',
    });

    await expect(
      service.login({ email: 'test@example.com', password: 'wrong-password' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('returns an access + refresh token pair for valid credentials', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      role: 'CUSTOMER',
      password: await bcrypt.hash('correct-password', 10),
    });

    const result = await service.login({
      email: 'test@example.com',
      password: 'correct-password',
    });

    expect(result.access_token).toBe('signed.jwt.token');
    expect(typeof result.refresh_token).toBe('string');
    expect(result.refresh_token.length).toBeGreaterThan(0);
    expect(redisClientMock.set).toHaveBeenCalledWith(
      `refresh:${result.refresh_token}`,
      '1',
      'EX',
      30 * 24 * 60 * 60,
    );
  });

  it('rejects refresh for an unknown or expired refresh token', async () => {
    redisClientMock.get.mockResolvedValue(null);

    await expect(service.refresh('bogus-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rotates the refresh token and issues a new pair', async () => {
    redisClientMock.get.mockResolvedValue('1');
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      role: 'CUSTOMER',
    });

    const result = await service.refresh('old-token');

    expect(redisClientMock.del).toHaveBeenCalledWith('refresh:old-token');
    expect(result.access_token).toBe('signed.jwt.token');
    expect(result.refresh_token).not.toBe('old-token');
  });

  it('deletes the refresh token on logout', async () => {
    await service.logout('some-token');

    expect(redisClientMock.del).toHaveBeenCalledWith('refresh:some-token');
  });
});
