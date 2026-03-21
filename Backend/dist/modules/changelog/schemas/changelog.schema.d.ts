import { Document } from 'mongoose';
export type ChangelogDocument = Changelog & Document;
export declare class Changelog {
    titulo: string;
    descripcion: string;
    version?: string;
    tag: string;
    destinatarios: string;
}
export declare const ChangelogSchema: import("mongoose").Schema<Changelog, import("mongoose").Model<Changelog, any, any, any, Document<unknown, any, Changelog, any, {}> & Changelog & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Changelog, Document<unknown, {}, import("mongoose").FlatRecord<Changelog>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Changelog> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
