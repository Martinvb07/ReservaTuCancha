import { Module } from '@nestjs/common';
import { EpaycoConfirmationController } from './epayco-confirmation.controller';
import { BookingsModule } from '../bookings/bookings.module';
import { EpaycoModule } from '../epayco/epayco.module';

/**
 * Solo aloja la confirmación de ePayco.
 *
 * Antes vivía acá la integración con Stripe (PaymentsService, PaymentIntents y
 * la colección Payment), que quedó sin uso cuando el cobro pasó a una pasarela
 * colombiana: el estado del pago se guarda en la propia reserva
 * (`epaycoRefPayco`).
 */
@Module({
  imports: [BookingsModule, EpaycoModule],
  controllers: [EpaycoConfirmationController],
})
export class PaymentsModule {}
