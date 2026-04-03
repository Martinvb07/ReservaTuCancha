import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { Court, CourtSchema } from '../courts/schemas/court.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Solicitud, SolicitudSchema } from '../solicitudes/solicitudes.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Court.name, schema: CourtSchema },
      { name: User.name, schema: UserSchema },
      { name: Solicitud.name, schema: SolicitudSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
