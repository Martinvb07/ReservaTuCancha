import { Document, Types } from 'mongoose';
export type CourtDocument = Court & Document;
export declare enum SportType {
    FUTBOL = "futbol",
    PADEL = "padel",
    VOLEY_PLAYA = "voley_playa"
}
export declare class GeoLocation {
    address: string;
    coordinates: [number, number];
    city: string;
    department: string;
}
export declare class AvailabilitySlot {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    slotDurationMinutes: number;
}
export declare class Court {
    ownerId: Types.ObjectId;
    name: string;
    description: string;
    sport: SportType;
    location: GeoLocation;
    pricePerHour: number;
    currency: string;
    photos: string[];
    availability: AvailabilitySlot[];
    isActive: boolean;
    averageRating: number;
    totalReviews: number;
    amenities: string[];
}
export declare const CourtSchema: import("mongoose").Schema<Court, import("mongoose").Model<Court, any, any, any, Document<unknown, any, Court, any, {}> & Court & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Court, Document<unknown, {}, import("mongoose").FlatRecord<Court>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Court> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
