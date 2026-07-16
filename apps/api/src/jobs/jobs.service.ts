import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JobStatus, PriceType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddressesService } from '../addresses/addresses.service';
import { CreateJobDto } from './dto/create-job.dto';
import { QuoteJobDto } from './dto/quote-job.dto';
import { ScheduleJobDto } from './dto/schedule-job.dto';

const CANCELLABLE_STATUSES: JobStatus[] = [
  JobStatus.REQUESTED,
  JobStatus.QUOTED,
  JobStatus.ACCEPTED,
  JobStatus.SCHEDULED,
];

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private addressesService: AddressesService,
  ) {}

  async create(customerId: number, data: CreateJobDto) {
    await this.addressesService.findOwned(customerId, data.addressId);

    const service = await this.prisma.service.findFirst({
      where: { id: data.serviceId, deletedAt: null },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return this.prisma.job.create({
      data: {
        customerId,
        providerId: service.providerId,
        serviceId: service.id,
        addressId: data.addressId,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        status: JobStatus.REQUESTED,
      },
    });
  }

  async findMine(userId: number, page: number, limit: number) {
    const where = {
      deletedAt: null,
      OR: [{ customerId: userId }, { provider: { userId } }],
    };

    const [data, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: 'desc' as const },
        include: { service: true, address: true, quote: true },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(userId: number, id: number) {
    const job = await this.prisma.job.findFirst({
      where: { id, deletedAt: null },
      include: {
        service: true,
        address: true,
        quote: true,
        provider: { select: { id: true, userId: true } },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.customerId !== userId && job.provider.userId !== userId) {
      throw new ForbiddenException('You are not a party to this job');
    }

    return job;
  }

  async quote(userId: number, jobId: number, data: QuoteJobDto) {
    const job = await this.getJobForProvider(userId, jobId);
    const service = await this.prisma.service.findUniqueOrThrow({
      where: { id: job.serviceId },
    });

    if (service.priceType !== PriceType.QUOTE) {
      throw new UnprocessableEntityException(
        'This service does not require a quote',
      );
    }
    this.assertStatus(job.status, JobStatus.REQUESTED, 'quote');

    await this.prisma.quote.create({
      data: { jobId: job.id, amount: data.amount, note: data.note },
    });

    return this.prisma.job.update({
      where: { id: job.id },
      data: { status: JobStatus.QUOTED },
    });
  }

  async providerAccept(userId: number, jobId: number) {
    const job = await this.getJobForProvider(userId, jobId);
    const service = await this.prisma.service.findUniqueOrThrow({
      where: { id: job.serviceId },
    });

    if (service.priceType === PriceType.QUOTE) {
      throw new UnprocessableEntityException(
        'This service requires a quote before it can be accepted',
      );
    }
    this.assertStatus(job.status, JobStatus.REQUESTED, 'accept');

    return this.prisma.job.update({
      where: { id: job.id },
      data: { status: JobStatus.ACCEPTED },
    });
  }

  async acceptQuote(userId: number, jobId: number) {
    const job = await this.getJobForCustomer(userId, jobId);
    this.assertStatus(job.status, JobStatus.QUOTED, 'accept the quote for');

    return this.prisma.job.update({
      where: { id: job.id },
      data: { status: JobStatus.ACCEPTED },
    });
  }

  async schedule(userId: number, jobId: number, data: ScheduleJobDto) {
    const job = await this.getJobForProvider(userId, jobId);
    this.assertStatus(job.status, JobStatus.ACCEPTED, 'schedule');

    return this.prisma.job.update({
      where: { id: job.id },
      data: {
        status: JobStatus.SCHEDULED,
        scheduledAt: new Date(data.scheduledAt),
      },
    });
  }

  async start(userId: number, jobId: number) {
    const job = await this.getJobForProvider(userId, jobId);
    this.assertStatus(job.status, JobStatus.SCHEDULED, 'start');

    return this.prisma.job.update({
      where: { id: job.id },
      data: { status: JobStatus.IN_PROGRESS },
    });
  }

  async complete(userId: number, jobId: number) {
    const job = await this.getJobForProvider(userId, jobId);
    this.assertStatus(job.status, JobStatus.IN_PROGRESS, 'complete');

    return this.prisma.job.update({
      where: { id: job.id },
      data: { status: JobStatus.COMPLETED, completedAt: new Date() },
    });
  }

  async pay(userId: number, jobId: number) {
    const job = await this.getJobForCustomer(userId, jobId);
    this.assertStatus(job.status, JobStatus.COMPLETED, 'mark as paid');

    return this.prisma.job.update({
      where: { id: job.id },
      data: { status: JobStatus.PAID },
    });
  }

  async cancel(userId: number, jobId: number) {
    const job = await this.getJobForParty(userId, jobId);

    if (!CANCELLABLE_STATUSES.includes(job.status)) {
      throw new UnprocessableEntityException(
        `Cannot cancel a job in status ${job.status}`,
      );
    }

    return this.prisma.job.update({
      where: { id: job.id },
      data: { status: JobStatus.CANCELLED },
    });
  }

  async dispute(userId: number, jobId: number) {
    const job = await this.getJobForParty(userId, jobId);
    this.assertStatus(job.status, JobStatus.COMPLETED, 'dispute');

    return this.prisma.job.update({
      where: { id: job.id },
      data: { status: JobStatus.DISPUTED },
    });
  }

  private assertStatus(
    current: JobStatus,
    required: JobStatus,
    action: string,
  ) {
    if (current !== required) {
      throw new UnprocessableEntityException(
        `Cannot ${action} a job in status ${current}`,
      );
    }
  }

  private async getJobForProvider(userId: number, jobId: number) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, deletedAt: null },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // A caller with no provider profile at all is simply not authorized to
    // act as a provider on this job -- that's a 403, not a 404, and must be
    // checked after (not instead of) the job's own existence check above.
    const profile = await this.prisma.providerProfile.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!profile || job.providerId !== profile.id) {
      throw new ForbiddenException('You are not the provider for this job');
    }

    return job;
  }

  private async getJobForCustomer(userId: number, jobId: number) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, deletedAt: null },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }
    if (job.customerId !== userId) {
      throw new ForbiddenException('You are not the customer for this job');
    }

    return job;
  }

  private async getJobForParty(userId: number, jobId: number) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, deletedAt: null },
      include: { provider: { select: { userId: true } } },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }
    if (job.customerId !== userId && job.provider.userId !== userId) {
      throw new ForbiddenException('You are not a party to this job');
    }

    return job;
  }
}
