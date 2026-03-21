import { Document, Types } from 'mongoose';
export type ReviewDocument = Review & Document;
export declare class Review {
    courtId: Types.ObjectId;
    bookingId: Types.ObjectId;
    guestName: string;
    rating: number;
    comment?: string;
    reviewToken: string;
    isVisible: boolean;
}
export declare const ReviewSchema: import("mongoose").Schema<Review, import("mongoose").Model<Review, any, any, any, Document<unknown, any, Review, any, {}> & Review & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Review, Document<unknown, {}, import("mongoose").FlatRecord<Review>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Review> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
