import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateAddressDto {
  @ApiPropertyOptional({ example: 'Home' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({ example: 'Tehran' })
  @IsString()
  city: string;

  @ApiPropertyOptional({ example: 'Vanak' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({ example: 'No. 12, Valiasr St.' })
  @IsString()
  line1: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postalCode?: string;
}
