import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsInt()
  serviceId: number;

  @ApiProperty({
    description: 'ISO datetime, UTC',
    example: '2026-08-01T09:00:00.000Z',
  })
  @IsDateString()
  startAt: string;
}
