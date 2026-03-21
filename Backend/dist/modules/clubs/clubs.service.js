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
exports.ClubsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const club_schema_1 = require("./schemas/club.schema");
const court_schema_1 = require("../courts/schemas/court.schema");
let ClubsService = class ClubsService {
    constructor(clubModel, courtModel) {
        this.clubModel = clubModel;
        this.courtModel = courtModel;
    }
    async findClubsBySportAndCity(deporte, ciudad) {
        let clubQuery = {};
        if (ciudad) {
            clubQuery.city = { $regex: `^${ciudad.trim()}$`, $options: 'i' };
        }
        let clubs;
        if (!deporte || deporte === 'all') {
            clubs = await this.clubModel.find(clubQuery).exec();
        }
        else {
            const courts = await this.courtModel.find({ sport: deporte }).exec();
            const ownerIds = [...new Set(courts.map(c => c.ownerId.toString()))].map(id => new mongoose_2.Types.ObjectId(id));
            if (ownerIds.length === 0)
                return [];
            clubQuery.ownerUserId = { $in: ownerIds };
            clubs = await this.clubModel.find(clubQuery).exec();
        }
        const enriched = await Promise.all(clubs.map(async (club) => {
            const courts = await this.courtModel
                .find({ ownerId: club.ownerUserId })
                .select('sport')
                .exec();
            const sports = [...new Set(courts.map((c) => c.sport))];
            const totalCourts = courts.length;
            return {
                _id: club._id,
                name: club.name,
                logo: club.logo,
                address: club.address,
                city: club.city,
                contactEmail: club.contactEmail,
                contactPhone: club.contactPhone,
                ownerUserId: club.ownerUserId,
                sports,
                totalCourts,
            };
        }));
        return enriched;
    }
};
exports.ClubsService = ClubsService;
exports.ClubsService = ClubsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(club_schema_1.Club.name)),
    __param(1, (0, mongoose_1.InjectModel)(court_schema_1.Court.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], ClubsService);
//# sourceMappingURL=clubs.service.js.map