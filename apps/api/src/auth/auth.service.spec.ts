import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtServiceMock },
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

  it('returns an access token for valid credentials', async () => {
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

    expect(result).toEqual({ access_token: 'signed.jwt.token' });
  });
});
