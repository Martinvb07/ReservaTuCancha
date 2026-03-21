import { Model, Types } from 'mongoose';
import { Court, CourtDocument, SportType } from './schemas/court.schema';
import { CreateCourtDto } from './dto/create-court.dto';
export interface CourtFilters {
    sport?: SportType;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
}
export declare class CourtsService {
    private courtModel;
    constructor(courtModel: Model<CourtDocument>);
    findAll(filters?: CourtFilters): Promise<{
        data: (import("mongoose").FlattenMaps<CourtDocument> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findById(id: string): Promise<Court>;
    findByOwner(ownerId: string): Promise<(Court & {
        _id: any;
    })[]>;
    create(ownerId: string, dto: CreateCourtDto): Promise<Court>;
    update(id: string, ownerId: string, dto: Partial<CreateCourtDto>): Promise<Court>;
    updateRating(courtId: string, newAvg: number, total: number): Promise<void>;
}
