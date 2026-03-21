import { CourtsService } from './courts.service';
import { CreateCourtDto } from './dto/create-court.dto';
import { SportType } from './schemas/court.schema';
export declare class CourtsController {
    private readonly courtsService;
    constructor(courtsService: CourtsService);
    findAll(sport?: SportType, city?: string, minPrice?: string, maxPrice?: string, page?: string, limit?: string): Promise<{
        data: (import("mongoose").FlattenMaps<import("./schemas/court.schema").CourtDocument> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<import("./schemas/court.schema").Court>;
    findMyCourtss(req: any): Promise<(import("./schemas/court.schema").Court & {
        _id: any;
    })[]>;
    create(req: any, dto: CreateCourtDto): Promise<import("./schemas/court.schema").Court>;
    update(id: string, req: any, dto: Partial<CreateCourtDto>): Promise<import("./schemas/court.schema").Court>;
}
