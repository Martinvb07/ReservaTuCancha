import { Document } from 'mongoose';
export type UserDocument = User & Document;
export declare enum UserRole {
    OWNER = "owner",
    ADMIN = "admin"
}
export declare class User {
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    phone?: string;
    avatarUrl?: string;
    isActive: boolean;
    lastLoginAt?: Date;
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, Document<unknown, any, User, any, {}> & User & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, import("mongoose").FlatRecord<User>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<User> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
