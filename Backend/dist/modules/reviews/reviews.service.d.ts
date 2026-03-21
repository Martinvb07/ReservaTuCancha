import { Model } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { BookingDocument } from '../bookings/schemas/booking.schema';
import { CourtsService } from '../courts/courts.service';
export declare class CreateReviewDto {
    reviewToken: string;
    rating: number;
    comment?: string;
}
export declare class ReviewsService {
    private reviewModel;
    private bookingModel;
    private readonly courtsService;
    constructor(reviewModel: Model<ReviewDocument>, bookingModel: Model<BookingDocument>, courtsService: CourtsService);
    create(dto: CreateReviewDto): Promise<Review>;
    findByCourt(courtId: string): Promise<Review[]>;
    private recalculateCourtRating;
}
