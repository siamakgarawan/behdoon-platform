import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'کوتاهی مو' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Rial' })
  @IsInt()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Minutes' })
  @IsInt()
  @Min(5)
  durationMin: number;

  @ApiProperty()
  @IsInt()
  categoryId: number;
}
