"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsService = exports.CreateReviewDto = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const review_schema_1 = require("./schemas/review.schema");
const booking_schema_1 = require("../bookings/schemas/booking.schema");
const courts_service_1 = require("../courts/courts.service");
class CreateReviewDto {
}
exports.CreateReviewDto = CreateReviewDto;
let ReviewsService = class ReviewsService {
    constructor(reviewModel, bookingModel, courtsService) {
        this.reviewModel = reviewModel;
        this.bookingModel = bookingModel;
        this.courtsService = courtsService;
    }
    async create(dto) {
        const booking = await this.bookingModel.findOne({ reviewToken: dto.reviewToken });
        if (!booking)
            throw new common_1.NotFoundException('Token de reseña inválido');
        if (booking.reviewTokenUsed)
            throw new common_1.BadRequestException('Esta reseña ya fue enviada');
        const existing = await this.reviewModel.findOne({ reviewToken: dto.reviewToken });
        if (existing)
            throw new common_1.BadRequestException('Ya existe una reseña para esta reserva');
        const review = new this.reviewModel({
            courtId: booking.courtId,
            bookingId: booking._id,
            guestName: booking.guestName,
            rating: dto.rating,
            comment: dto.comment,
            reviewToken: dto.reviewToken,
        });
        await review.save();
        booking.reviewTokenUsed = true;
        await booking.save();
        await this.recalculateCourtRating(booking.courtId.toString());
        return review;
    }
    async findByCourt(courtId) {
        return this.reviewModel
            .find({ courtId: new mongoose_2.Types.ObjectId(courtId), isVisible: true })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
    }
    async recalculateCourtRating(courtId) {
        const result = await this.reviewModel.aggregate([
            { $match: { courtId: new mongoose_2.Types.ObjectId(courtId), isVisible: true } },
            { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
        ]);
        if (result.length > 0) {
            await this.courtsService.updateRating(courtId, result[0].avgRating, result[0].count);
        }
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(review_schema_1.Review.name)),
    __param(1, (0, mongoose_1.InjectModel)(booking_schema_1.Booking.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        courts_service_1.CourtsService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map