import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Plumbing' })
  @IsString()
  @MinLength(2)
  name: string;
}
