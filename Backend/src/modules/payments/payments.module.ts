import { Module, forwardRef } from '@nestjs/common'; // Agregamos forwardRef
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsController } from './payments.controller';
import { WompiWebhookController } from './wompi-webhook.controller';
import { PaymentsService } from './payments.service';
import { WompiService } from '../wompi/wompi.service';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { BookingsModule } from '../bookings/bookings.module';
import { ClubsModule } from '../clubs/clubs.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
    forwardRef(() => BookingsModule), // <--- CAMBIO AQUÍ
    ClubsModule,
  ],
  controllers: [PaymentsController, WompiWebhookController],
  providers: [PaymentsService, WompiService],
  exports: [PaymentsService, WompiService],
})
export class PaymentsModule {}