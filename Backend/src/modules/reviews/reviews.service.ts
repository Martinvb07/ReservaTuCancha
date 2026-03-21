import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { CourtsService } from '../courts/courts.service';

export class CreateReviewDto {
  reviewToken: string;
  rating: number;
  comment?: string;
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private readonly courtsService: CourtsService,
  ) {}

  async create(dto: CreateReviewDto): Promise<Review> {
    // Validar token de reseña
    const booking = await this.bookingModel.findOne({ reviewToken: dto.reviewToken });
    if (!booking) throw new NotFoundException('Token de reseña inválido');
    if (booking.reviewTokenUsed) throw new BadRequestException('Esta reseña ya fue enviada');

    // Verificar que no exista ya una reseña con este token
    const existing = await this.reviewModel.findOne({ reviewToken: dto.reviewToken });
    if (existing) throw new BadRequestException('Ya existe una reseña para esta reserva');

    const review = new this.reviewModel({
      courtId: booking.courtId,
      bookingId: booking._id,
      guestName: booking.guestName,
      rating: dto.rating,
      comment: dto.comment,
      reviewToken: dto.reviewToken,
    });
    await review.save();

    // Marcar token como usado
    booking.reviewTokenUsed = true;
    await booking.save();

    // Recalcular promedio de la cancha
    await this.recalculateCourtRating(booking.courtId.toString());

    return review;
  }

  async findByCourt(courtId: string): Promise<Review[]> {
    return this.reviewModel
      .find({ courtId: new Types.ObjectId(courtId), isVisible: true })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  }

  private async recalculateCourtRating(courtId: string) {
    const result = await this.reviewModel.aggregate([
      { $match: { courtId: new Types.ObjectId(courtId), isVisible: true } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (result.length > 0) {
      await this.courtsService.updateRating(courtId, result[0].avgRating, result[0].count);
    }
  }
}
