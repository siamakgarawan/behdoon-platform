import { ApiProperty } from '@nestjs/swagger';
import { Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: '+989121234567' })
  @Matches(/^\+?[0-9]{8,15}$/, { message: 'Invalid phone number' })
  phone: string;

  @ApiProperty({ example: '123456' })
  @Length(6, 6)
  code: string;
}
