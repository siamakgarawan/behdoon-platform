import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  create(userId: number, data: CreateAddressDto) {
    return this.prisma.address.create({ data: { ...data, userId } });
  }

  findMine(userId: number) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { id: 'asc' },
    });
  }

  async findOwned(userId: number, id: number) {
    const address = await this.prisma.address.findUnique({ where: { id } });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (address.userId !== userId) {
      throw new ForbiddenException('You do not own this address');
    }

    return address;
  }
}
