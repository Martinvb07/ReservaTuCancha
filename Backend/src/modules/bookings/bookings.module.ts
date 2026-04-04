import { Module, forwardRef } from '@nestjs/common'; // 1. Importar forwardRef
import { MongooseModule } from '@nestjs/mongoose';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { Club, ClubSchema } from '../clubs/schemas/club.schema';
import { Court, CourtSchema } from '../courts/schemas/court.schema';
import { BlockedSlot, BlockedSlotSchema } from '../courts/schemas/blocked-slot.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Club.name, schema: ClubSchema },
      { name: Court.name, schema: CourtSchema },
      { name: BlockedSlot.name, schema: BlockedSlotSchema },
      { name: User.name, schema: UserSchema },
    ]),
    NotificationsModule,
    // 2. Usar forwardRef para evitar la referencia circular con Payments
    forwardRef(() => PaymentsModule), 
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}