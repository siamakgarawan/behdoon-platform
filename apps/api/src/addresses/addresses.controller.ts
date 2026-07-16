import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@ApiTags('addresses')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() data: CreateAddressDto) {
    return this.addressesService.create(req.user.id, data);
  }

  @Get('mine')
  findMine(@Req() req: AuthenticatedRequest) {
    return this.addressesService.findMine(req.user.id);
  }
}
