import { Module } from '@nestjs/common';
import { WompiWebhookController } from './wompi-webhook.controller';
import { BookingsModule } from '../bookings/bookings.module';
import { WompiModule } from '../wompi/wompi.module';

/**
 * Solo aloja el webhook de Wompi.
 *
 * Antes vivía acá la integración con Stripe (PaymentsService, PaymentIntents y
 * la colección Payment), que quedó sin uso cuando el cobro pasó a Wompi: el
 * estado del pago se guarda en la propia reserva (`wompiTransactionId`).
 */
@Module({
  imports: [BookingsModule, WompiModule],
  controllers: [WompiWebhookController],
})
export class PaymentsModule {}
