import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getOwnerStats(req: any): Promise<{
        totalBookings: number;
        confirmedBookings: number;
        pendingBookings: number;
        totalRevenue: any;
        topCourt: any;
        totalCourts: number;
    }>;
    getOwnerMonthly(req: any): Promise<any[]>;
    getAdminStats(): Promise<{
        totalBookings: number;
        totalRevenue: any;
        bookingsByStatus: any[];
        bookingsBySport: any[];
        recentActivity: (import("mongoose").FlattenMaps<import("../bookings/schemas/booking.schema").BookingDocument> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
    }>;
    getAdminMonthly(): Promise<any[]>;
}
