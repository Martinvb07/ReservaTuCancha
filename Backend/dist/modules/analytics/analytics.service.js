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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const booking_schema_1 = require("../bookings/schemas/booking.schema");
const court_schema_1 = require("../courts/schemas/court.schema");
let AnalyticsService = class AnalyticsService {
    constructor(bookingModel, courtModel) {
        this.bookingModel = bookingModel;
        this.courtModel = courtModel;
    }
    async getOwnerStats(ownerId) {
        const courts = await this.courtModel.find({ ownerId: new mongoose_2.Types.ObjectId(ownerId) }).select('_id');
        const courtIds = courts.map((c) => c._id);
        const [totalBookings, confirmedBookings, pendingBookings, revenue, topCourt] = await Promise.all([
            this.bookingModel.countDocuments({ courtId: { $in: courtIds } }),
            this.bookingModel.countDocuments({ courtId: { $in: courtIds }, status: booking_schema_1.BookingStatus.CONFIRMED }),
            this.bookingModel.countDocuments({ courtId: { $in: courtIds }, status: booking_schema_1.BookingStatus.PENDING }),
            this.bookingModel.aggregate([
                { $match: { courtId: { $in: courtIds }, status: booking_schema_1.BookingStatus.CONFIRMED } },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } },
            ]),
            this.bookingModel.aggregate([
                { $match: { courtId: { $in: courtIds }, status: booking_schema_1.BookingStatus.CONFIRMED } },
                { $group: { _id: '$courtId', count: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
                { $sort: { revenue: -1 } },
                { $limit: 1 },
            ]),
        ]);
        return {
            totalBookings,
            confirmedBookings,
            pendingBookings,
            totalRevenue: revenue[0]?.total ?? 0,
            topCourt: topCourt[0] ?? null,
            totalCourts: courts.length,
        };
    }
    async getAdminStats() {
        const [totalBookings, totalRevenue, bookingsByStatus, bookingsBySport, recentActivity] = await Promise.all([
            this.bookingModel.countDocuments(),
            this.bookingModel.aggregate([
                { $match: { status: booking_schema_1.BookingStatus.CONFIRMED } },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } },
            ]),
            this.bookingModel.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            this.bookingModel.aggregate([
                {
                    $lookup: {
                        from: 'courts', localField: 'courtId',
                        foreignField: '_id', as: 'court',
                    },
                },
                { $unwind: '$court' },
                { $group: { _id: '$court.sport', count: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
                { $sort: { count: -1 } },
            ]),
            this.bookingModel
                .find()
                .sort({ createdAt: -1 })
                .limit(10)
                .select('guestName date startTime status totalPrice')
                .lean(),
        ]);
        return {
            totalBookings,
            totalRevenue: totalRevenue[0]?.total ?? 0,
            bookingsByStatus,
            bookingsBySport,
            recentActivity,
        };
    }
    async getMonthlyRevenue(ownerId) {
        const matchStage = { status: booking_schema_1.BookingStatus.CONFIRMED };
        if (ownerId) {
            const courts = await this.courtModel.find({ ownerId: new mongoose_2.Types.ObjectId(ownerId) }).select('_id');
            matchStage.courtId = { $in: courts.map((c) => c._id) };
        }
        return this.bookingModel.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { year: { $year: '$date' }, month: { $month: '$date' } },
                    revenue: { $sum: '$totalPrice' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            { $limit: 12 },
        ]);
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(booking_schema_1.Booking.name)),
    __param(1, (0, mongoose_1.InjectModel)(court_schema_1.Court.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map