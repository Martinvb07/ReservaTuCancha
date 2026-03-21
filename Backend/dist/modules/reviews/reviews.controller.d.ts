import { ReviewsService, CreateReviewDto } from './reviews.service';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    create(dto: CreateReviewDto): Promise<import("./schemas/review.schema").Review>;
    findByCourt(courtId: string): Promise<import("./schemas/review.schema").Review[]>;
}
