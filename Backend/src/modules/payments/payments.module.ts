import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsController } from './payments.controller';
import { WompiWebhookController } from './wompi-webhook.controller'; // <-- Nuevo
import { PaymentsService } from './payments.service';
import { WompiService } from '../wompi/wompi.service'; // <-- Nuevo
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { BookingsModule } from '../bookings/bookings.module';
import { ClubsModule } from '../clubs/clubs.module'; // <-- Nuevo

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
    BookingsModule,
    ClubsModule, // Para acceder a las credenciales de Wompi del club
  ],
  controllers: [
    PaymentsController, 
    WompiWebhookController // <-- Registramos el controlador del Webhook
  ],
  providers: [
    PaymentsService, 
    WompiService // <-- Registramos el servicio que creamos antes
  ],
  exports: [PaymentsService, WompiService],
})
export class PaymentsModule {}