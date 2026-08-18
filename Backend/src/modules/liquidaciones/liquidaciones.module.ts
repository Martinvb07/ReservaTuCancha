import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LiquidacionesController } from './liquidaciones.controller';
import { LiquidacionesService } from './liquidaciones.service';
import { Liquidacion, LiquidacionSchema } from './schemas/liquidacion.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { Club, ClubSchema } from '../clubs/schemas/club.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Liquidacion.name, schema: LiquidacionSchema },
      { name: Booking.name,     schema: BookingSchema },
      { name: Club.name,        schema: ClubSchema },
    ]),
  ],
  controllers: [LiquidacionesController],
  providers: [LiquidacionesService],
  exports: [LiquidacionesService],
})
export class LiquidacionesModule {}
