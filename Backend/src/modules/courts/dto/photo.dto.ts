import { IsUrl, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PhotoDto {
  @ApiProperty({ example: 'https://res.cloudinary.com/.../cancha.jpg' })
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  url: string;
}
