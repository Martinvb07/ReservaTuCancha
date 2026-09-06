import { IsEmail, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateClubProfileDto {
  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(80)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(1000)
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(200)
  address?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(80)
  city?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(20)
  contactPhone?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsEmail()
  contactEmail?: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) @MaxLength(500)
  logo?: string;
}
