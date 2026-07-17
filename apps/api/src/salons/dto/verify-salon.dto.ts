import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class VerifySalonDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  verified: boolean;
}
