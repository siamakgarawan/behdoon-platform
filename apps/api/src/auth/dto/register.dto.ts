import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Ali Rezaei' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'ali@behdoon.ir' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'a-strong-password', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
