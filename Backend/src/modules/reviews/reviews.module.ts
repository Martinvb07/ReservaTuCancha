import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { Review, ReviewSchema } from './schemas/review.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { CourtsModule } from '../courts/courts.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Review.name, schema: ReviewSchema },
      { name: Booking.name, schema: BookingSchema },
    ]),
    CourtsModule,
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
