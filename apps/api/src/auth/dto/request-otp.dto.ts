import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({ example: '+989121234567' })
  @Matches(/^\+?[0-9]{8,15}$/, { message: 'Invalid phone number' })
  phone: string;
}
