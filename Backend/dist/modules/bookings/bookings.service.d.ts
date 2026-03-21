import { Model } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { NotificationsService } from '../notifications/notifications.service';
export declare class BookingsService {
    private bookingModel;
    private readonly notificationsService;
    constructor(bookingModel: Model<BookingDocument>, notificationsService: NotificationsService);
    create(createBookingDto: CreateBookingDto): Promise<Booking>;
    findById(id: string): Promise<Booking>;
    findByCancelToken(token: string): Promise<Booking>;
    confirmPayment(bookingId: string): Promise<Booking>;
    cancelByToken(token: string): Promise<{
        message: string;
    }>;
    updateStatus(id: string, status: string): Promise<Booking>;
    findByCourtAndDate(courtId: string, date: string): Promise<Booking[]>;
    findByOwner(ownerCourtIds: string[]): Promise<Booking[]>;
    findAll(page?: number, limit?: number, guestEmail?: string): Promise<{
        data: (import("mongoose").FlattenMaps<BookingDocument> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
}
