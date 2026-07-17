import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

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
}
