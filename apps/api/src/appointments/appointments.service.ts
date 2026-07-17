import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CreateReviewDto } from './dto/create-review.dto';

const ACTIVE_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
];

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async create(customerId: number, data: CreateAppointmentDto) {
    const service = await this.prisma.service.findFirst({
      where: { id: data.serviceId, deletedAt: null },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const salon = await this.prisma.salon.findFirst({
      where: { id: service.salonId, deletedAt: null, verified: true },
    });

    if (!salon) {
      throw new NotFoundException('Salon not found');
    }

    const startAt = new Date(data.startAt);
    const endAt = new Date(startAt.getTime() + service.durationMin * 60000);
    const weekday = startAt.getUTCDay();

    const workingHour = await this.prisma.workingHour.findUnique({
      where: { salonId_weekday: { salonId: salon.id, weekday } },
    });

    if (!workingHour) {
      throw new UnprocessableEntityException('The salon is closed on that day');
    }

    const dayStr = startAt.toISOString().slice(0, 10);
    const openAt = new Date(`${dayStr}T${workingHour.startTime}:00.000Z`);
    const closeAt = new Date(`${dayStr}T${workingHour.endTime}:00.000Z`);

    if (startAt < openAt || endAt > closeAt) {
      throw new UnprocessableEntityException(
        "The requested time is outside the salon's working hours",
      );
    }

    const conflict = await this.prisma.appointment.findFirst({
      where: {
        salonId: salon.id,
        deletedAt: null,
        status: { in: ACTIVE_STATUSES },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    });

    if (conflict) {
      throw new ConflictException('This time slot is already booked');
    }

    return this.prisma.appointment.create({
      data: {
        customerId,
        salonId: salon.id,
        serviceId: service.id,
        startAt,
        endAt,
      },
    });
  }

  async getAvailability(salonId: number, serviceId: number, dateStr: string) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, salonId, deletedAt: null },
    });

    if (!service) {
      throw new NotFoundException('Service not found for this salon');
    }

    const weekday = new Date(`${dateStr}T00:00:00.000Z`).getUTCDay();
    const workingHour = await this.prisma.workingHour.findUnique({
      where: { salonId_weekday: { salonId, weekday } },
    });

    if (!workingHour) {
      return [];
    }

    const openAt = new Date(`${dateStr}T${workingHour.startTime}:00.000Z`);
    const closeAt = new Date(`${dateStr}T${workingHour.endTime}:00.000Z`);

    const existing = await this.prisma.appointment.findMany({
      where: {
        salonId,
        deletedAt: null,
        status: { in: ACTIVE_STATUSES },
        startAt: { gte: openAt, lt: closeAt },
      },
    });

    const stepMs = service.durationMin * 60000;
    const slots: string[] = [];

    for (
      let cursor = openAt.getTime();
      cursor + stepMs <= closeAt.getTime();
      cursor += stepMs
    ) {
      const slotStart = new Date(cursor);
      const slotEnd = new Date(cursor + stepMs);
      const overlaps = existing.some(
        (appt) => slotStart < appt.endAt && slotEnd > appt.startAt,
      );
      if (!overlaps) {
        slots.push(slotStart.toISOString());
      }
    }

    return slots;
  }

  async findMine(userId: number, page: number, limit: number) {
    const where = {
      deletedAt: null,
      OR: [{ customerId: userId }, { salon: { userId } }],
    };

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startAt: 'desc' as const },
        include: { service: true, salon: true },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  findOne(userId: number, id: number) {
    return this.getForParty(userId, id);
  }

  async confirm(userId: number, id: number) {
    const appointment = await this.getForSalonOwner(userId, id);
    this.assertStatus(appointment.status, AppointmentStatus.PENDING, 'confirm');

    return this.prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: AppointmentStatus.CONFIRMED },
    });
  }

  async complete(userId: number, id: number) {
    const appointment = await this.getForSalonOwner(userId, id);
    this.assertStatus(
      appointment.status,
      AppointmentStatus.CONFIRMED,
      'complete',
    );

    return this.prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: AppointmentStatus.COMPLETED },
    });
  }

  async noShow(userId: number, id: number) {
    const appointment = await this.getForSalonOwner(userId, id);
    this.assertStatus(
      appointment.status,
      AppointmentStatus.CONFIRMED,
      'mark as no-show',
    );

    return this.prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: AppointmentStatus.NO_SHOW },
    });
  }

  async cancel(userId: number, id: number) {
    const appointment = await this.getForParty(userId, id);

    if (!ACTIVE_STATUSES.includes(appointment.status)) {
      throw new UnprocessableEntityException(
        `Cannot cancel an appointment in status ${appointment.status}`,
      );
    }

    return this.prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: AppointmentStatus.CANCELLED },
    });
  }

  async review(userId: number, id: number, data: CreateReviewDto) {
    const appointment = await this.getForCustomer(userId, id);
    this.assertStatus(
      appointment.status,
      AppointmentStatus.COMPLETED,
      'review',
    );

    const existing = await this.prisma.review.findUnique({
      where: { appointmentId: appointment.id },
    });

    if (existing) {
      throw new ConflictException('This appointment has already been reviewed');
    }

    return this.prisma.review.create({
      data: {
        appointmentId: appointment.id,
        salonId: appointment.salonId,
        customerId: userId,
        rating: data.rating,
        comment: data.comment,
      },
    });
  }

  private async getForCustomer(userId: number, id: number) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, deletedAt: null },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    if (appointment.customerId !== userId) {
      throw new ForbiddenException(
        'You are not the customer for this appointment',
      );
    }

    return appointment;
  }

  private assertStatus(
    current: AppointmentStatus,
    required: AppointmentStatus,
    action: string,
  ) {
    if (current !== required) {
      throw new UnprocessableEntityException(
        `Cannot ${action} an appointment in status ${current}`,
      );
    }
  }

  private async getForParty(userId: number, id: number) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, deletedAt: null },
      include: { salon: { select: { userId: true } }, service: true },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (
      appointment.customerId !== userId &&
      appointment.salon.userId !== userId
    ) {
      throw new ForbiddenException('You are not a party to this appointment');
    }

    return appointment;
  }

  private async getForSalonOwner(userId: number, id: number) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, deletedAt: null },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const salon = await this.prisma.salon.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!salon || appointment.salonId !== salon.id) {
      throw new ForbiddenException(
        'You are not the salon for this appointment',
      );
    }

    return appointment;
  }
}
