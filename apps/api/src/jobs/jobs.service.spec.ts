import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JobStatus, PriceType } from '@prisma/client';
import { JobsService } from './jobs.service';
import { PrismaService } from '../prisma/prisma.service';
import { AddressesService } from '../addresses/addresses.service';

describe('JobsService', () => {
  let service: JobsService;
  const prismaMock = {
    job: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    service: {
      findFirst: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    providerProfile: {
      findFirst: jest.fn(),
    },
    quote: {
      create: jest.fn(),
    },
  };
  const addressesServiceMock = { findOwned: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AddressesService, useValue: addressesServiceMock },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('verifies the address belongs to the caller before creating the job', async () => {
      addressesServiceMock.findOwned.mockResolvedValue({ id: 10, userId: 1 });
      prismaMock.service.findFirst.mockResolvedValue({
        id: 2,
        providerId: 5,
      });

      let capturedData: Record<string, unknown> | undefined;
      prismaMock.job.create.mockImplementation(
        (args: { data: Record<string, unknown> }) => {
          capturedData = args.data;
          return Promise.resolve({ id: 1, status: 'REQUESTED' });
        },
      );

      await service.create(1, { serviceId: 2, addressId: 10 });

      expect(addressesServiceMock.findOwned).toHaveBeenCalledWith(1, 10);
      expect(capturedData).toEqual(
        expect.objectContaining({
          customerId: 1,
          providerId: 5,
          serviceId: 2,
          addressId: 10,
          status: JobStatus.REQUESTED,
        }),
      );
    });

    it("propagates the ForbiddenException when the address is not the caller's", async () => {
      addressesServiceMock.findOwned.mockRejectedValue(
        new ForbiddenException(),
      );

      await expect(
        service.create(1, { serviceId: 2, addressId: 10 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('rejects a caller who is neither the customer nor the provider', async () => {
      prismaMock.job.findFirst.mockResolvedValue({
        customerId: 1,
        provider: { userId: 2 },
      });

      await expect(service.findOne(99, 1)).rejects.toThrow(ForbiddenException);
    });

    it('allows the customer to read their own job', async () => {
      prismaMock.job.findFirst.mockResolvedValue({
        customerId: 1,
        provider: { userId: 2 },
      });

      await expect(service.findOne(1, 1)).resolves.toBeDefined();
    });
  });

  describe('quote', () => {
    it('rejects quoting a non-QUOTE-priced service', async () => {
      prismaMock.job.findFirst.mockResolvedValue({
        id: 1,
        providerId: 5,
        serviceId: 2,
        status: JobStatus.REQUESTED,
      });
      prismaMock.providerProfile.findFirst.mockResolvedValue({ id: 5 });
      prismaMock.service.findUniqueOrThrow.mockResolvedValue({
        priceType: PriceType.FIXED,
      });

      await expect(service.quote(1, 1, { amount: 100000 })).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('rejects a provider who does not own the job', async () => {
      prismaMock.job.findFirst.mockResolvedValue({ id: 1, providerId: 999 });
      prismaMock.providerProfile.findFirst.mockResolvedValue({ id: 5 });

      await expect(service.quote(1, 1, { amount: 100000 })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns 403, not 404, when the caller has no provider profile at all', async () => {
      prismaMock.job.findFirst.mockResolvedValue({ id: 1, providerId: 5 });
      prismaMock.providerProfile.findFirst.mockResolvedValue(null);

      await expect(service.quote(1, 1, { amount: 100000 })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('creates a Quote and moves the job to QUOTED', async () => {
      prismaMock.job.findFirst.mockResolvedValue({
        id: 1,
        providerId: 5,
        serviceId: 2,
        status: JobStatus.REQUESTED,
      });
      prismaMock.providerProfile.findFirst.mockResolvedValue({ id: 5 });
      prismaMock.service.findUniqueOrThrow.mockResolvedValue({
        priceType: PriceType.QUOTE,
      });
      prismaMock.job.update.mockResolvedValue({
        id: 1,
        status: JobStatus.QUOTED,
      });

      const result = await service.quote(1, 1, {
        amount: 250000,
        note: 'Needs a new part',
      });

      expect(prismaMock.quote.create).toHaveBeenCalledWith({
        data: { jobId: 1, amount: 250000, note: 'Needs a new part' },
      });
      expect(result.status).toBe(JobStatus.QUOTED);
    });
  });

  describe('providerAccept', () => {
    it('rejects accepting a QUOTE-priced service directly', async () => {
      prismaMock.job.findFirst.mockResolvedValue({
        id: 1,
        providerId: 5,
        serviceId: 2,
        status: JobStatus.REQUESTED,
      });
      prismaMock.providerProfile.findFirst.mockResolvedValue({ id: 5 });
      prismaMock.service.findUniqueOrThrow.mockResolvedValue({
        priceType: PriceType.QUOTE,
      });

      await expect(service.providerAccept(1, 1)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('accepts a FIXED-priced job from REQUESTED', async () => {
      prismaMock.job.findFirst.mockResolvedValue({
        id: 1,
        providerId: 5,
        serviceId: 2,
        status: JobStatus.REQUESTED,
      });
      prismaMock.providerProfile.findFirst.mockResolvedValue({ id: 5 });
      prismaMock.service.findUniqueOrThrow.mockResolvedValue({
        priceType: PriceType.FIXED,
      });
      prismaMock.job.update.mockResolvedValue({
        id: 1,
        status: JobStatus.ACCEPTED,
      });

      const result = await service.providerAccept(1, 1);

      expect(result.status).toBe(JobStatus.ACCEPTED);
    });
  });

  describe('lifecycle guards', () => {
    it('rejects scheduling a job that is not yet ACCEPTED', async () => {
      prismaMock.job.findFirst.mockResolvedValue({
        id: 1,
        providerId: 5,
        status: JobStatus.REQUESTED,
      });
      prismaMock.providerProfile.findFirst.mockResolvedValue({ id: 5 });

      await expect(
        service.schedule(1, 1, { scheduledAt: '2026-08-01T10:00:00.000Z' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('rejects cancelling a COMPLETED job', async () => {
      prismaMock.job.findFirst.mockResolvedValue({
        id: 1,
        customerId: 1,
        status: JobStatus.COMPLETED,
        provider: { userId: 2 },
      });

      await expect(service.cancel(1, 1)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('allows cancelling a REQUESTED job by either party', async () => {
      prismaMock.job.findFirst.mockResolvedValue({
        id: 1,
        customerId: 1,
        status: JobStatus.REQUESTED,
        provider: { userId: 2 },
      });
      prismaMock.job.update.mockResolvedValue({
        id: 1,
        status: JobStatus.CANCELLED,
      });

      const result = await service.cancel(1, 1);

      expect(result.status).toBe(JobStatus.CANCELLED);
    });

    it('throws NotFoundException for a job that does not exist', async () => {
      prismaMock.job.findFirst.mockResolvedValue(null);

      await expect(service.cancel(1, 999)).rejects.toThrow(NotFoundException);
    });
  });
});
