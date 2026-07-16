import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from './prisma/prisma.service';
import { JwtGuard } from './auth/jwt/jwt.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getHello(): string {
    return 'Behdoon API is running';
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('users')
  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }
}
