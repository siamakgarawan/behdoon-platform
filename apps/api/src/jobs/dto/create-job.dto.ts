import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional } from 'class-validator';

export class CreateJobDto {
  @ApiProperty()
  @IsInt()
  serviceId: number;

  @ApiProperty()
  @IsInt()
  addressId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
