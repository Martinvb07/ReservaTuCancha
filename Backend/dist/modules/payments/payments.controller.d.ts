import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
declare class CreateIntentDto {
    bookingId: string;
    amount: number;
    currency?: string;
}
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    createIntent(dto: CreateIntentDto): Promise<{
        clientSecret: string;
        paymentId: import("mongoose").Types.ObjectId;
    }>;
    handleWebhook(req: RawBodyRequest<Request>, signature: string): Promise<{
        received: boolean;
    }>;
}
export {};
