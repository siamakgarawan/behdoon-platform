import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, data: CreateServiceDto) {
    const salon = await this.getOwnSalon(userId);

    return this.prisma.service.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        durationMin: data.durationMin,
        categoryId: data.categoryId,
        salonId: salon.id,
      },
    });
  }

  async findAll(page: number, limit: number, categoryId?: number) {
    const where = {
      deletedAt: null,
      salon: { verified: true },
      ...(categoryId ? { categoryId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: 'asc' as const },
        include: { category: true, salon: true },
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findMine(userId: number) {
    const salon = await this.getOwnSalon(userId);
    return this.prisma.service.findMany({
      where: { salonId: salon.id, deletedAt: null },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const service = await this.prisma.service.findFirst({
      where: { id, deletedAt: null },
      include: { category: true, salon: true },
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

  private async getOwnSalon(userId: number) {
    const salon = await this.prisma.salon.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!salon) {
      throw new NotFoundException('You do not have a salon profile');
    }

    return salon;
  }

  private async assertOwnership(userId: number, serviceId: number) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, deletedAt: null },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const salon = await this.prisma.salon.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!salon || service.salonId !== salon.id) {
      throw new ForbiddenException('You do not own this service');
    }

    return service;
  }
}
