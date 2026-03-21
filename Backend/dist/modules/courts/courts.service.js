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
exports.CourtsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const court_schema_1 = require("./schemas/court.schema");
let CourtsService = class CourtsService {
    constructor(courtModel) {
        this.courtModel = courtModel;
    }
    async findAll(filters = {}) {
        const { sport, city, minPrice, maxPrice, page = 1, limit = 12 } = filters;
        const query = { isActive: true };
        if (sport)
            query.sport = sport;
        if (city)
            query['location.city'] = { $regex: city, $options: 'i' };
        if (minPrice !== undefined || maxPrice !== undefined) {
            query.pricePerHour = {};
            if (minPrice !== undefined)
                query.pricePerHour.$gte = minPrice;
            if (maxPrice !== undefined)
                query.pricePerHour.$lte = maxPrice;
        }
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.courtModel
                .find(query)
                .select('-availability')
                .sort({ averageRating: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.courtModel.countDocuments(query),
        ]);
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findById(id) {
        const court = await this.courtModel.findById(id).lean();
        if (!court)
            throw new common_1.NotFoundException('Cancha no encontrada');
        return court;
    }
    async findByOwner(ownerId) {
        return this.courtModel.find({ ownerId: new mongoose_2.Types.ObjectId(ownerId) }).lean();
    }
    async create(ownerId, dto) {
        const court = new this.courtModel({ ...dto, ownerId: new mongoose_2.Types.ObjectId(ownerId) });
        return court.save();
    }
    async update(id, ownerId, dto) {
        const court = await this.courtModel.findById(id);
        if (!court)
            throw new common_1.NotFoundException('Cancha no encontrada');
        if (court.ownerId.toString() !== ownerId)
            throw new common_1.ForbiddenException('No tienes permiso');
        Object.assign(court, dto);
        return court.save();
    }
    async updateRating(courtId, newAvg, total) {
        await this.courtModel.findByIdAndUpdate(courtId, {
            averageRating: Math.round(newAvg * 10) / 10,
            totalReviews: total,
        });
    }
};
exports.CourtsService = CourtsService;
exports.CourtsService = CourtsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(court_schema_1.Court.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], CourtsService);
//# sourceMappingURL=courts.service.js.map