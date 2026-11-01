import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { ListaEsperaService } from './lista-espera.service';
import { ListaEspera, ListaEsperaSchema } from './schemas/lista-espera.schema';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { Club, ClubSchema } from '../clubs/schemas/club.schema';
import { Court, CourtSchema } from '../courts/schemas/court.schema';
import { BlockedSlot, BlockedSlotSchema } from '../courts/schemas/blocked-slot.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { EpaycoModule } from '../epayco/epayco.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Club.name, schema: ClubSchema },
      { name: Court.name, schema: CourtSchema },
      { name: BlockedSlot.name, schema: BlockedSlotSchema },
      { name: User.name, schema: UserSchema },
      { name: ListaEspera.name, schema: ListaEsperaSchema },
    ]),
    NotificationsModule,
    EpaycoModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, ListaEsperaService],
  exports: [BookingsService],
})
export class BookingsModule {}