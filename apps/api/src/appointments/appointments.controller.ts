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
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@ApiTags('appointments')
@Controller()
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('salons/:salonId/availability')
  getAvailability(
    @Param('salonId', ParseIntPipe) salonId: number,
    @Query('serviceId', ParseIntPipe) serviceId: number,
    @Query('date') date: string,
  ) {
    return this.appointmentsService.getAvailability(salonId, serviceId, date);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Post('appointments')
  create(@Req() req: AuthenticatedRequest, @Body() data: CreateAppointmentDto) {
    return this.appointmentsService.create(req.user.id, data);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Get('appointments/me')
  findMine(
    @Req() req: AuthenticatedRequest,
    @Query() query: PaginationQueryDto,
  ) {
    return this.appointmentsService.findMine(
      req.user.id,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Get('appointments/:id')
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.appointmentsService.findOne(req.user.id, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Post('appointments/:id/confirm')
  confirm(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.appointmentsService.confirm(req.user.id, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Post('appointments/:id/complete')
  complete(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.appointmentsService.complete(req.user.id, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Post('appointments/:id/no-show')
  noShow(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.appointmentsService.noShow(req.user.id, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Post('appointments/:id/cancel')
  cancel(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.appointmentsService.cancel(req.user.id, id);
  }
}
