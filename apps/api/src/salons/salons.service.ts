import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSalonDto } from './dto/create-salon.dto';
import { UpdateSalonDto } from './dto/update-salon.dto';
import { SetWorkingHoursDto } from './dto/set-working-hours.dto';
import { AddSalonPhotoDto } from './dto/add-salon-photo.dto';

export interface RatingSummary {
  average: number | null;
  count: number;
}

@Injectable()
export class SalonsService {
  constructor(private prisma: PrismaService) {}

  async createForUser(userId: number, data: CreateSalonDto) {
    const existing = await this.prisma.salon.findUnique({ where: { userId } });

    if (existing) {
      throw new ConflictException('You already have a salon profile');
    }

    const [salon] = await this.prisma.$transaction([
      this.prisma.salon.create({ data: { userId, ...data } }),
      this.prisma.user.update({
        where: { id: userId },
        data: { role: UserRole.PROVIDER },
      }),
    ]);

    return salon;
  }

  async findAll(page: number, limit: number, city?: string) {
    const where = {
      deletedAt: null,
      verified: true,
      ...(city ? { city } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.salon.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: 'asc' as const },
      }),
      this.prisma.salon.count({ where }),
    ]);

    const ratings = await this.ratingsFor(data.map((salon) => salon.id));

    return {
      data: data.map((salon) => ({
        ...salon,
        rating: ratings.get(salon.id) ?? { average: null, count: 0 },
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const salon = await this.prisma.salon.findFirst({
      where: { id, deletedAt: null },
      include: {
        services: { where: { deletedAt: null } },
        workingHours: true,
        photos: { orderBy: { createdAt: 'asc' } },
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: { customer: { select: { name: true } } },
        },
      },
    });

    if (!salon) {
      throw new NotFoundException('Salon not found');
    }

    const ratings = await this.ratingsFor([id]);

    return { ...salon, rating: ratings.get(id) ?? { average: null, count: 0 } };
  }

  async findByUserId(userId: number) {
    const salon = await this.prisma.salon.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!salon) {
      throw new NotFoundException('You do not have a salon profile');
    }

    return salon;
  }

  async updateOwn(userId: number, data: UpdateSalonDto) {
    const salon = await this.findByUserId(userId);
    return this.prisma.salon.update({ where: { id: salon.id }, data });
  }

  async setVerified(id: number, verified: boolean) {
    const salon = await this.prisma.salon.findFirst({
      where: { id, deletedAt: null },
    });

    if (!salon) {
      throw new NotFoundException('Salon not found');
    }

    return this.prisma.salon.update({ where: { id }, data: { verified } });
  }

  async setWorkingHours(userId: number, data: SetWorkingHoursDto) {
    const salon = await this.findByUserId(userId);

    const weekdays = data.hours.map((hour) => hour.weekday);
    if (new Set(weekdays).size !== weekdays.length) {
      throw new UnprocessableEntityException(
        'Duplicate weekday in working hours',
      );
    }

    await this.prisma.$transaction([
      this.prisma.workingHour.deleteMany({ where: { salonId: salon.id } }),
      this.prisma.workingHour.createMany({
        data: data.hours.map((hour) => ({ salonId: salon.id, ...hour })),
      }),
    ]);

    return this.prisma.workingHour.findMany({
      where: { salonId: salon.id },
      orderBy: { weekday: 'asc' },
    });
  }

  async addPhoto(userId: number, data: AddSalonPhotoDto) {
    const salon = await this.findByUserId(userId);
    return this.prisma.salonPhoto.create({
      data: { salonId: salon.id, url: data.url },
    });
  }

  async removePhoto(userId: number, photoId: number): Promise<void> {
    const salon = await this.findByUserId(userId);
    const photo = await this.prisma.salonPhoto.findFirst({
      where: { id: photoId },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }
    if (photo.salonId !== salon.id) {
      throw new ForbiddenException('You do not own this photo');
    }

    await this.prisma.salonPhoto.delete({ where: { id: photoId } });
  }

  private async ratingsFor(
    salonIds: number[],
  ): Promise<Map<number, RatingSummary>> {
    if (salonIds.length === 0) {
      return new Map();
    }

    const grouped = await this.prisma.review.groupBy({
      by: ['salonId'],
      where: { salonId: { in: salonIds } },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return new Map(
      grouped.map((row) => [
        row.salonId,
        { average: row._avg.rating, count: row._count.rating },
      ]),
    );
  }
}
