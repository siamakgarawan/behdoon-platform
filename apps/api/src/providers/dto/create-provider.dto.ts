import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateProviderDto {
  @ApiPropertyOptional({
    example: 'Licensed electrician, 10 years experience',
  })
  @IsOptional()
  @IsString()
  bio?: string;
}
