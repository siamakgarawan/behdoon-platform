import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { QuoteJobDto } from './dto/quote-job.dto';
import { ScheduleJobDto } from './dto/schedule-job.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@ApiTags('jobs')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() data: CreateJobDto) {
    return this.jobsService.create(req.user.id, data);
  }

  @Get('me')
  findMine(
    @Req() req: AuthenticatedRequest,
    @Query() query: PaginationQueryDto,
  ) {
    return this.jobsService.findMine(
      req.user.id,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Get(':id')
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.jobsService.findOne(req.user.id, id);
  }

  @Post(':id/quote')
  quote(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: QuoteJobDto,
  ) {
    return this.jobsService.quote(req.user.id, id, data);
  }

  @Post(':id/provider-accept')
  providerAccept(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.jobsService.providerAccept(req.user.id, id);
  }

  @Post(':id/accept-quote')
  acceptQuote(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.jobsService.acceptQuote(req.user.id, id);
  }

  @Post(':id/schedule')
  schedule(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: ScheduleJobDto,
  ) {
    return this.jobsService.schedule(req.user.id, id, data);
  }

  @Post(':id/start')
  start(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.jobsService.start(req.user.id, id);
  }

  @Post(':id/complete')
  complete(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.jobsService.complete(req.user.id, id);
  }

  @Post(':id/pay')
  pay(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.jobsService.pay(req.user.id, id);
  }

  @Post(':id/cancel')
  cancel(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.jobsService.cancel(req.user.id, id);
  }

  @Post(':id/dispute')
  dispute(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.jobsService.dispute(req.user.id, id);
  }
}
