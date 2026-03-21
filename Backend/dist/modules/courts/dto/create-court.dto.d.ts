import { SportType } from '../schemas/court.schema';
declare class LocationDto {
    address: string;
    city: string;
    department: string;
    coordinates?: [number, number];
}
declare class AvailabilitySlotDto {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    slotDurationMinutes?: number;
}
export declare class CreateCourtDto {
    name: string;
    description?: string;
    sport: SportType;
    location: LocationDto;
    pricePerHour: number;
    currency?: string;
    photos?: string[];
    availability?: AvailabilitySlotDto[];
    amenities?: string[];
}
export {};
