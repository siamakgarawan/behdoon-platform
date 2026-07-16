import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    private prisma: PrismaService,
    private providersService: ProvidersService,
  ) {}

  async create(userId: number, data: CreateServiceDto) {
    const profile = await this.providersService.findByUserId(userId);

    return this.prisma.service.create({
      data: {
        title: data.title,
        description: data.description,
        priceType: data.priceType,
        price: data.price,
        duration: data.duration,
        categoryId: data.categoryId,
        providerId: profile.id,
      },
    });
  }

  async findAll(page: number, limit: number, categoryId?: number) {
    const where = {
      deletedAt: null,
      provider: { verified: true },
      ...(categoryId ? { categoryId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: 'asc' as const },
        include: { category: true },
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findMine(userId: number) {
    const profile = await this.providersService.findByUserId(userId);
    return this.prisma.service.findMany({
      where: { providerId: profile.id, deletedAt: null },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const service = await this.prisma.service.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        provider: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async update(userId: number, id: number, data: UpdateServiceDto) {
    const service = await this.assertOwnership(userId, id);
    return this.prisma.service.update({ where: { id: service.id }, data });
  }

  async remove(userId: number, id: number): Promise<void> {
    const service = await this.assertOwnership(userId, id);
    await this.prisma.service.update({
      where: { id: service.id },
      data: { deletedAt: new Date() },
    });
  }

  private async assertOwnership(userId: number, serviceId: number) {
    const profile = await this.providersService.findByUserId(userId);
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, deletedAt: null },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.providerId !== profile.id) {
      throw new ForbiddenException('You do not own this service');
    }

    return service;
  }
}
