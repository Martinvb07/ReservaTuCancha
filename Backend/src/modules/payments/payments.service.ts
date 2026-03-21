import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentDocument, PaymentStatus } from './schemas/payment.schema';
import { BookingsService } from '../bookings/bookings.service';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private readonly bookingsService: BookingsService,
    private readonly configService: ConfigService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY'), {
      apiVersion: '2026-02-25.clover',
    });
  }

  async createPaymentIntent(bookingId: string, amount: number, currency = 'cop') {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amount * 100, // Stripe usa centavos
      currency,
      metadata: { bookingId },
    });

    const payment = new this.paymentModel({
      bookingId: new Types.ObjectId(bookingId),
      stripePaymentIntentId: paymentIntent.id,
      amount,
      currency: currency.toUpperCase(),
    });
    await payment.save();

    return { clientSecret: paymentIntent.client_secret, paymentId: payment._id };
  }

  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch {
      throw new BadRequestException('Webhook signature inválida');
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const bookingId = intent.metadata.bookingId;

      await this.paymentModel.findOneAndUpdate(
        { stripePaymentIntentId: intent.id },
        { status: PaymentStatus.PAID, paidAt: new Date() },
      );

      await this.bookingsService.confirmPayment(bookingId);
    }

    if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent;
      await this.paymentModel.findOneAndUpdate(
        { stripePaymentIntentId: intent.id },
        { status: PaymentStatus.FAILED },
      );
    }

    return { received: true };
  }
}
