import { SolicitudesService } from './solicitudes.service';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
export declare class SolicitudesController {
    private readonly solicitudesService;
    constructor(solicitudesService: SolicitudesService);
    create(body: CreateSolicitudDto): Promise<{
        message: string;
    }>;
    findAll(): Promise<(import("mongoose").Document<unknown, {}, import("./solicitudes.schema").Solicitud, {}, {}> & import("./solicitudes.schema").Solicitud & Required<{
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
