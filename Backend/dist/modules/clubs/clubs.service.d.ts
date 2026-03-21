import { Model } from 'mongoose';
import { ClubDocument } from './schemas/club.schema';
import { CourtDocument } from '../courts/schemas/court.schema';
export declare class ClubsService {
    private clubModel;
    private courtModel;
    constructor(clubModel: Model<ClubDocument>, courtModel: Model<CourtDocument>);
    findClubsBySportAndCity(deporte: string, ciudad: string): Promise<{
        _id: any;
        name: any;
        logo: any;
        address: any;
        city: any;
        contactEmail: any;
        contactPhone: any;
        ownerUserId: any;
        sports: string[];
        totalCourts: number;
    }[]>;
}
