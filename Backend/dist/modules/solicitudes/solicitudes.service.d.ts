import { Model } from 'mongoose';
import { Solicitud } from './solicitudes.schema';
import { User } from '../users/schemas/user.schema';
import { NotificationsService } from '../notifications/notifications.service';
export declare class SolicitudesService {
    private solicitudModel;
    private userModel;
    private readonly notificationsService;
    constructor(solicitudModel: Model<Solicitud>, userModel: Model<User>, notificationsService: NotificationsService);
    crearSolicitud(data: any): Promise<import("mongoose").Document<unknown, {}, Solicitud, {}, {}> & Solicitud & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    listarSolicitudes(): Promise<(import("mongoose").Document<unknown, {}, Solicitud, {}, {}> & Solicitud & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    aprobar(id: string): Promise<{
        message: string;
        email: string;
    }>;
    rechazar(id: string): Promise<{
        message: string;
    }>;
    reenviarCredenciales(id: string): Promise<{
        message: string;
    }>;
}
