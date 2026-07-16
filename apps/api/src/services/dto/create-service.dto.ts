import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PriceType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Leak repair' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: PriceType })
  @IsEnum(PriceType)
  priceType: PriceType;

  @ApiPropertyOptional({
    description: 'Rial. Required for FIXED/HOURLY, omitted for QUOTE.',
  })
  @ValidateIf((dto: CreateServiceDto) => dto.priceType !== PriceType.QUOTE)
  @IsInt()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Minutes' })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @ApiProperty()
  @IsInt()
  categoryId: number;
}
