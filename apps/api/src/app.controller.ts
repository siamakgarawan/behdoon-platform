import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getHello(): string {
    return 'Behdoon API is running';
  }

  @Get('users')
  async getUsers() {
    return this.prisma.user.findMany();
  }
}
