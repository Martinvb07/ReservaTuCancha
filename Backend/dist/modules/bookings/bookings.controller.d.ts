import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
export declare class BookingsController {
    private readonly bookingsService;
    constructor(bookingsService: BookingsService);
    create(dto: CreateBookingDto): Promise<import("./schemas/booking.schema").Booking>;
    cancelByToken(token: string): Promise<{
        message: string;
    }>;
    getCancelInfo(token: string): Promise<import("./schemas/booking.schema").Booking>;
    getSlots(courtId: string, date: string): Promise<import("./schemas/booking.schema").Booking[]>;
    findByOwner(req: any): Promise<import("./schemas/booking.schema").Booking[]>;
    findAll(page?: string, limit?: string, guestEmail?: string): Promise<{
        data: (import("mongoose").FlattenMaps<import("./schemas/booking.schema").BookingDocument> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<import("./schemas/booking.schema").Booking>;
    updateStatus(id: string, status: string): Promise<import("./schemas/booking.schema").Booking>;
}
