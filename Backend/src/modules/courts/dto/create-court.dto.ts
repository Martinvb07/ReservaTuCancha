import { IsString, IsEnum, IsNumber, IsOptional, IsArray, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SportType } from '../schemas/court.schema';

class LocationDto {
  @IsString() address: string;
  @IsString() city: string;
  @IsString() department: string;
  @IsOptional() @IsArray() coordinates?: [number, number];
}

class AvailabilitySlotDto {
  @IsNumber() @Min(0) dayOfWeek: number;
  @IsString() openTime: string;
  @IsString() closeTime: string;
  @IsOptional() @IsNumber() slotDurationMinutes?: number;
}

export class CreateCourtDto {
  @ApiProperty({ example: 'Cancha El Estadio' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Cancha de fútbol 5 con luz nocturna' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: SportType })
  @IsEnum(SportType)
  sport: SportType;

  @ApiProperty()
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiProperty({ example: 80000 })
  @IsNumber()
  @Min(0)
  pricePerHour: number;

  @ApiProperty({ example: 'COP', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  photos?: string[];

  @ApiProperty({ type: [AvailabilitySlotDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  availability?: AvailabilitySlotDto[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  amenities?: string[];
}
