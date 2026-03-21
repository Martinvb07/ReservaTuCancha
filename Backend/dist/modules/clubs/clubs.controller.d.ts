import { ClubsService } from './clubs.service';
export declare class ClubsController {
    private readonly clubsService;
    constructor(clubsService: ClubsService);
    getClubsBySport(deporte: string, ciudad: string): Promise<{
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
