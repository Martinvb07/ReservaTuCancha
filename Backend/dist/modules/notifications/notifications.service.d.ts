import { ConfigService } from '@nestjs/config';
import { Booking } from '../bookings/schemas/booking.schema';
export declare class NotificationsService {
    private readonly configService;
    private readonly logger;
    private readonly frontendUrl;
    private readonly fromEmail;
    constructor(configService: ConfigService);
    private send;
    sendBookingConfirmation(booking: Booking & {
        _id: any;
    }): Promise<void>;
    sendCancellationConfirmation(booking: Booking & {
        _id: any;
    }): Promise<void>;
    sendReviewRequest(booking: Booking & {
        _id: any;
    }): Promise<void>;
    sendApprovalEmail(email: string, name: string, tempPassword: string): Promise<void>;
    sendRejectionEmail(email: string, name: string): Promise<void>;
    sendChangelogNotification(titulo: string, descripcion: string, version?: string): Promise<void>;
    sendAdminNotification({ subject, html }: {
        subject: string;
        html: string;
    }): Promise<void>;
}
