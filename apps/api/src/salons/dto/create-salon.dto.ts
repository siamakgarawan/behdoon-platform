import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateSalonDto {
  @ApiProperty({ example: 'سالن زیبایی رز' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'بیش از ۱۰ سال سابقه در خدمات آرایشی' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ example: 'Tehran' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'خیابان ولیعصر، پلاک ۱۲' })
  @IsString()
  address: string;

  @ApiPropertyOptional({ example: '+989121234567' })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({ example: 'rose_beauty_salon' })
  @IsOptional()
  @IsString()
  instagram?: string;

  @ApiPropertyOptional({ example: 35.7219 })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ example: 51.3347 })
  @IsOptional()
  @IsLongitude()
  longitude?: number;
}
