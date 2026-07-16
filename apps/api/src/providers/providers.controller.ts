import {
  Body,
  Controller,
  Get,
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
import { ProvidersService } from './providers.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { VerifyProviderDto } from './dto/verify-provider.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@ApiTags('providers')
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  findAll(
    @Query() query: PaginationQueryDto,
    @Query('verified') verified?: string,
  ) {
    const verifiedFilter =
      verified === undefined ? undefined : verified === 'true';
    return this.providersService.findAll(
      query.page ?? 1,
      query.limit ?? 20,
      verifiedFilter,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Get('me')
  findOwn(@Req() req: AuthenticatedRequest) {
    return this.providersService.findByUserId(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.providersService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() data: CreateProviderDto) {
    return this.providersService.createForUser(req.user.id, data);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Patch('me')
  updateOwn(@Req() req: AuthenticatedRequest, @Body() data: UpdateProviderDto) {
    return this.providersService.updateOwn(req.user.id, data);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/verify')
  verify(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: VerifyProviderDto,
  ) {
    return this.providersService.setVerified(id, data.verified);
  }
}
