import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { PaymentDocument } from './schemas/payment.schema';
import { BookingsService } from '../bookings/bookings.service';
export declare class PaymentsService {
    private paymentModel;
    private readonly bookingsService;
    private readonly configService;
    private stripe;
    constructor(paymentModel: Model<PaymentDocument>, bookingsService: BookingsService, configService: ConfigService);
    createPaymentIntent(bookingId: string, amount: number, currency?: string): Promise<{
        clientSecret: string;
        paymentId: Types.ObjectId;
    }>;
    handleWebhook(payload: Buffer, signature: string): Promise<{
        received: boolean;
    }>;
}
