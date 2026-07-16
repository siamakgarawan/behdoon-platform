import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AddressesModule } from '../addresses/addresses.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [PrismaModule, AddressesModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
