import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { SmsService } from '../sms/sms.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const REFRESH_TOKEN_PREFIX = 'refresh:';
const OTP_PREFIX = 'otp:';
const OTP_TTL_SECONDS = 120;
const OTP_RESEND_COOLDOWN_SECONDS = 30;

@Injectable()
export class AuthService {
  private readonly refreshTtlSeconds: number;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redis: RedisService,
    private sms: SmsService,
    config: ConfigService,
  ) {
    const days = Number(config.get<string>('REFRESH_TOKEN_TTL_DAYS') ?? '30');
    this.refreshTtlSeconds = days * 24 * 60 * 60;
  }

  async register(data: RegisterDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async login(data: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user.id, user.email, user.role);
  }

  async requestOtp(phone: string): Promise<{ success: true }> {
    const key = OTP_PREFIX + phone;
    const remainingTtl = await this.redis.getClient().ttl(key);

    if (remainingTtl > OTP_TTL_SECONDS - OTP_RESEND_COOLDOWN_SECONDS) {
      throw new UnprocessableEntityException(
        'Please wait before requesting another code',
      );
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    await this.redis.getClient().set(key, code, 'EX', OTP_TTL_SECONDS);
    this.sms.send(phone, `Behdoon verification code: ${code}`);

    return { success: true };
  }

  async verifyOtp(phone: string, code: string) {
    const key = OTP_PREFIX + phone;
    const stored = await this.redis.getClient().get(key);

    if (!stored || stored !== code) {
      throw new UnauthorizedException('Invalid or expired code');
    }

    await this.redis.getClient().del(key);

    const user = await this.prisma.user.upsert({
      where: { phone },
      create: { phone, role: UserRole.CUSTOMER },
      update: {},
    });

    return this.issueTokens(user.id, user.email, user.role);
  }

  async refresh(refreshToken: string) {
    const key = REFRESH_TOKEN_PREFIX + refreshToken;
    const userId = await this.redis.getClient().get(key);

    if (!userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // rotate: the old refresh token is single-use
    await this.redis.getClient().del(key);

    const user = await this.prisma.user.findUnique({
      where: { id: Number(userId) },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.issueTokens(user.id, user.email, user.role);
  }

  async logout(refreshToken: string): Promise<{ success: true }> {
    await this.redis.getClient().del(REFRESH_TOKEN_PREFIX + refreshToken);
    return { success: true };
  }

  private async issueTokens(
    userId: number,
    email: string | null,
    role: UserRole,
  ) {
    const payload = { sub: userId, email, role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = crypto.randomBytes(40).toString('hex');

    await this.redis
      .getClient()
      .set(
        REFRESH_TOKEN_PREFIX + refreshToken,
        String(userId),
        'EX',
        this.refreshTtlSeconds,
      );

    return { access_token: accessToken, refresh_token: refreshToken };
  }
}
