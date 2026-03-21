import { Document, Types } from 'mongoose';
export type ClubDocument = Club & Document;
export declare class Club {
    name: string;
    logo?: string;
    address?: string;
    city?: string;
    contactEmail?: string;
    contactPhone?: string;
    ownerUserId: Types.ObjectId;
}
export declare const ClubSchema: import("mongoose").Schema<Club, import("mongoose").Model<Club, any, any, any, Document<unknown, any, Club, any, {}> & Club & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Club, Document<unknown, {}, import("mongoose").FlatRecord<Club>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Club> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
