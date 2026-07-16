import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';

@Injectable()
export class ProvidersService {
  constructor(private prisma: PrismaService) {}

  async createForUser(userId: number, data: CreateProviderDto) {
    const existing = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new ConflictException('You already have a provider profile');
    }

    const [profile] = await this.prisma.$transaction([
      this.prisma.providerProfile.create({
        data: { userId, bio: data.bio },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { role: UserRole.PROVIDER },
      }),
    ]);

    return profile;
  }

  async findAll(page: number, limit: number, verified?: boolean) {
    const where = {
      deletedAt: null,
      verified: verified ?? true,
    };

    const [data, total] = await Promise.all([
      this.prisma.providerProfile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: 'asc' as const },
        include: { user: { select: { id: true, name: true } } },
      }),
      this.prisma.providerProfile.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const profile = await this.prisma.providerProfile.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: { select: { id: true, name: true } },
        services: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Provider not found');
    }

    return profile;
  }

  async findByUserId(userId: number) {
    const profile = await this.prisma.providerProfile.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!profile) {
      throw new NotFoundException('You do not have a provider profile');
    }

    return profile;
  }

  async updateOwn(userId: number, data: UpdateProviderDto) {
    const profile = await this.findByUserId(userId);
    return this.prisma.providerProfile.update({
      where: { id: profile.id },
      data,
    });
  }

  async setVerified(id: number, verified: boolean) {
    await this.findOne(id);
    return this.prisma.providerProfile.update({
      where: { id },
      data: { verified },
    });
  }
}
