import { Document, Types } from 'mongoose';
export type BookingDocument = Booking & Document;
export declare enum BookingStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    CANCELLED = "cancelled",
    COMPLETED = "completed"
}
export declare class Booking {
    courtId: Types.ObjectId;
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    date: Date;
    startTime: string;
    endTime: string;
    players: number;
    notes?: string;
    status: BookingStatus;
    totalPrice: number;
    paymentId?: Types.ObjectId;
    cancelToken: string;
    reviewToken: string;
    reviewTokenUsed: boolean;
}
export declare const BookingSchema: import("mongoose").Schema<Booking, import("mongoose").Model<Booking, any, any, any, Document<unknown, any, Booking, any, {}> & Booking & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Booking, Document<unknown, {}, import("mongoose").FlatRecord<Booking>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Booking> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
