import { IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateSolicitudDto {
  @IsString() firstName: string;
  @IsString() lastName: string;
  @IsEmail() email: string;
  @IsString() businessName: string;
  @IsString() city: string;
  @IsString() department: string;
  @IsString() nit: string;
  @IsString() phone: string;
  @IsOptional() @IsString() message?: string;
}
