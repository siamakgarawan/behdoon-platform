import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class VerifyProviderDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  verified: boolean;
}
