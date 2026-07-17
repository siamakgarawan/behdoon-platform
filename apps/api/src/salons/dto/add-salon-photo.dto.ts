import { ApiProperty } from '@nestjs/swagger';
import { IsUrl } from 'class-validator';

export class AddSalonPhotoDto {
  @ApiProperty({ example: 'https://example.com/photo.jpg' })
  @IsUrl()
  url: string;
}
