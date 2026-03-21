import { Model, Types } from 'mongoose';
import { BookingDocument } from '../bookings/schemas/booking.schema';
import { CourtDocument } from '../courts/schemas/court.schema';
export declare class AnalyticsService {
    private bookingModel;
    private courtModel;
    constructor(bookingModel: Model<BookingDocument>, courtModel: Model<CourtDocument>);
    getOwnerStats(ownerId: string): Promise<{
        totalBookings: number;
        confirmedBookings: number;
        pendingBookings: number;
        totalRevenue: any;
        topCourt: any;
        totalCourts: number;
    }>;
    getAdminStats(): Promise<{
        totalBookings: number;
        totalRevenue: any;
        bookingsByStatus: any[];
        bookingsBySport: any[];
        recentActivity: (import("mongoose").FlattenMaps<BookingDocument> & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        })[];
    }>;
    getMonthlyRevenue(ownerId?: string): Promise<any[]>;
}
