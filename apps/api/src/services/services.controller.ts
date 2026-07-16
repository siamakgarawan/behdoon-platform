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
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  findAll(
    @Query() query: PaginationQueryDto,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.servicesService.findAll(
      query.page ?? 1,
      query.limit ?? 20,
      categoryId ? Number(categoryId) : undefined,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Get('mine')
  findMine(@Req() req: AuthenticatedRequest) {
    return this.servicesService.findMine(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() data: CreateServiceDto) {
    return this.servicesService.create(req.user.id, data);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateServiceDto,
  ) {
    return this.servicesService.update(req.user.id, id, data);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Delete(':id')
  @HttpCode(204)
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.servicesService.remove(req.user.id, id);
  }
}
