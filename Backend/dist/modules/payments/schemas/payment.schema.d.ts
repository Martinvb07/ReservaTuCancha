import { Document, Types } from 'mongoose';
export type PaymentDocument = Payment & Document;
export declare enum PaymentStatus {
    PENDING = "pending",
    PAID = "paid",
    REFUNDED = "refunded",
    FAILED = "failed"
}
export declare class Payment {
    bookingId: Types.ObjectId;
    stripePaymentIntentId: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    paidAt?: Date;
    refundedAt?: Date;
    stripeRefundId?: string;
}
export declare const PaymentSchema: import("mongoose").Schema<Payment, import("mongoose").Model<Payment, any, any, any, Document<unknown, any, Payment, any, {}> & Payment & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Payment, Document<unknown, {}, import("mongoose").FlatRecord<Payment>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Payment> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
