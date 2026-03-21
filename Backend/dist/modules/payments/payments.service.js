"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const stripe_1 = require("stripe");
const config_1 = require("@nestjs/config");
const payment_schema_1 = require("./schemas/payment.schema");
const bookings_service_1 = require("../bookings/bookings.service");
let PaymentsService = class PaymentsService {
    constructor(paymentModel, bookingsService, configService) {
        this.paymentModel = paymentModel;
        this.bookingsService = bookingsService;
        this.configService = configService;
        this.stripe = new stripe_1.default(this.configService.get('STRIPE_SECRET_KEY'), {
            apiVersion: '2026-02-25.clover',
        });
    }
    async createPaymentIntent(bookingId, amount, currency = 'cop') {
        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: amount * 100,
            currency,
            metadata: { bookingId },
        });
        const payment = new this.paymentModel({
            bookingId: new mongoose_2.Types.ObjectId(bookingId),
            stripePaymentIntentId: paymentIntent.id,
            amount,
            currency: currency.toUpperCase(),
        });
        await payment.save();
        return { clientSecret: paymentIntent.client_secret, paymentId: payment._id };
    }
    async handleWebhook(payload, signature) {
        const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
        let event;
        try {
            event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        }
        catch {
            throw new common_1.BadRequestException('Webhook signature inválida');
        }
        if (event.type === 'payment_intent.succeeded') {
            const intent = event.data.object;
            const bookingId = intent.metadata.bookingId;
            await this.paymentModel.findOneAndUpdate({ stripePaymentIntentId: intent.id }, { status: payment_schema_1.PaymentStatus.PAID, paidAt: new Date() });
            await this.bookingsService.confirmPayment(bookingId);
        }
        if (event.type === 'payment_intent.payment_failed') {
            const intent = event.data.object;
            await this.paymentModel.findOneAndUpdate({ stripePaymentIntentId: intent.id }, { status: payment_schema_1.PaymentStatus.FAILED });
        }
        return { received: true };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(payment_schema_1.Payment.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        bookings_service_1.BookingsService,
        config_1.ConfigService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map