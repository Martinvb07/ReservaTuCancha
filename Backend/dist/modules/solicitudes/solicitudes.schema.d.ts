import { Document } from 'mongoose';
export declare class Solicitud extends Document {
    firstName: string;
    lastName: string;
    email: string;
    businessName: string;
    city: string;
    department: string;
    nit: string;
    phone: string;
    message: string;
    estado: 'pendiente' | 'aprobada' | 'rechazada';
}
export declare const SolicitudSchema: import("mongoose").Schema<Solicitud, import("mongoose").Model<Solicitud, any, any, any, Document<unknown, any, Solicitud, any, {}> & Solicitud & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Solicitud, Document<unknown, {}, import("mongoose").FlatRecord<Solicitud>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Solicitud> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
