import { IsString, IsEnum, IsNumber, IsOptional, IsArray, Min, Max, MaxLength, ArrayMaxSize, ArrayMinSize, IsInt, ValidateNested, Matches } from 'class-validator';
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
  
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'openTime debe estar en formato HH:mm (24h)'
  })
  openTime: string;
  
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$|^00:00$/, {
    message: 'closeTime debe estar en formato HH:mm (24h). Use 00:00 para medianoche'
  })
  closeTime: string;
  
  @IsOptional() @IsNumber() slotDurationMinutes?: number;
}

class PriceRuleDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(7)
  @IsInt({ each: true }) @Min(0, { each: true }) @Max(6, { each: true })
  days: number[];

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { message: 'from debe estar en formato HH:mm (24h)' })
  from: string;

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { message: 'to debe estar en formato HH:mm (24h). Use 00:00 para medianoche' })
  to: string;

  @IsNumber() @Min(0)
  pricePerHour: number;

  @IsOptional() @IsString() @MaxLength(40)
  label?: string;
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

  @ApiProperty({ type: [PriceRuleDto], required: false, description: 'Precio distinto por días y horas' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => PriceRuleDto)
  priceRules?: PriceRuleDto[];

  @ApiProperty({ example: 'COP', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  photos?: string[];

  @ApiProperty({ 
    type: [AvailabilitySlotDto], 
    required: false,
    example: [
      {
        dayOfWeek: 1,
        openTime: "07:00",
        closeTime: "00:00",
        slotDurationMinutes: 60
      }
    ]
  })
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