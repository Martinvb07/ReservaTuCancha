import { Module, forwardRef } from '@nestjs/common'; // Agregamos forwardRef
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsController } from './payments.controller';
import { WompiWebhookController } from './wompi-webhook.controller';
import { PaymentsService } from './payments.service';
import { WompiModule } from '../wompi/wompi.module';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { BookingsModule } from '../bookings/bookings.module';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
    forwardRef(() => BookingsModule), // <--- CAMBIO AQUÍ
    WompiModule,
  ],
  controllers: [PaymentsController, WompiWebhookController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}