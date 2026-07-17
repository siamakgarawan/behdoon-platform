import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { SalonsService } from './salons.service';
import { CreateSalonDto } from './dto/create-salon.dto';
import { UpdateSalonDto } from './dto/update-salon.dto';
import { VerifySalonDto } from './dto/verify-salon.dto';
import { SetWorkingHoursDto } from './dto/set-working-hours.dto';
import { AddSalonPhotoDto } from './dto/add-salon-photo.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@ApiTags('salons')
@Controller('salons')
export class SalonsController {
  constructor(private readonly salonsService: SalonsService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto, @Query('city') city?: string) {
    return this.salonsService.findAll(query.page ?? 1, query.limit ?? 20, city);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Get('me')
  findOwn(@Req() req: AuthenticatedRequest) {
    return this.salonsService.findByUserId(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salonsService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() data: CreateSalonDto) {
    return this.salonsService.createForUser(req.user.id, data);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Patch('me')
  updateOwn(@Req() req: AuthenticatedRequest, @Body() data: UpdateSalonDto) {
    return this.salonsService.updateOwn(req.user.id, data);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Post('me/working-hours')
  setWorkingHours(
    @Req() req: AuthenticatedRequest,
    @Body() data: SetWorkingHoursDto,
  ) {
    return this.salonsService.setWorkingHours(req.user.id, data);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/verify')
  verify(@Param('id', ParseIntPipe) id: number, @Body() data: VerifySalonDto) {
    return this.salonsService.setVerified(id, data.verified);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Post('me/photos')
  addPhoto(@Req() req: AuthenticatedRequest, @Body() data: AddSalonPhotoDto) {
    return this.salonsService.addPhoto(req.user.id, data);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Delete('me/photos/:photoId')
  @HttpCode(204)
  removePhoto(
    @Req() req: AuthenticatedRequest,
    @Param('photoId', ParseIntPipe) photoId: number,
  ) {
    return this.salonsService.removePhoto(req.user.id, photoId);
  }
}
