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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourtSchema = exports.Court = exports.AvailabilitySlot = exports.GeoLocation = exports.SportType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var SportType;
(function (SportType) {
    SportType["FUTBOL"] = "futbol";
    SportType["PADEL"] = "padel";
    SportType["VOLEY_PLAYA"] = "voley_playa";
})(SportType || (exports.SportType = SportType = {}));
let GeoLocation = class GeoLocation {
};
exports.GeoLocation = GeoLocation;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], GeoLocation.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Number], index: '2dsphere' }),
    __metadata("design:type", Array)
], GeoLocation.prototype, "coordinates", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], GeoLocation.prototype, "city", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], GeoLocation.prototype, "department", void 0);
exports.GeoLocation = GeoLocation = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], GeoLocation);
let AvailabilitySlot = class AvailabilitySlot {
};
exports.AvailabilitySlot = AvailabilitySlot;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], AvailabilitySlot.prototype, "dayOfWeek", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AvailabilitySlot.prototype, "openTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AvailabilitySlot.prototype, "closeTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 60 }),
    __metadata("design:type", Number)
], AvailabilitySlot.prototype, "slotDurationMinutes", void 0);
exports.AvailabilitySlot = AvailabilitySlot = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], AvailabilitySlot);
let Court = class Court {
};
exports.Court = Court;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Court.prototype, "ownerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Court.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Court.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: SportType, required: true }),
    __metadata("design:type", String)
], Court.prototype, "sport", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: GeoLocation, required: true }),
    __metadata("design:type", GeoLocation)
], Court.prototype, "location", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], Court.prototype, "pricePerHour", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'COP' }),
    __metadata("design:type", String)
], Court.prototype, "currency", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Court.prototype, "photos", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [AvailabilitySlot], default: [] }),
    __metadata("design:type", Array)
], Court.prototype, "availability", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Court.prototype, "isActive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0, min: 0, max: 5 }),
    __metadata("design:type", Number)
], Court.prototype, "averageRating", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Court.prototype, "totalReviews", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Court.prototype, "amenities", void 0);
exports.Court = Court = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Court);
exports.CourtSchema = mongoose_1.SchemaFactory.createForClass(Court);
exports.CourtSchema.index({ sport: 1, isActive: 1 });
exports.CourtSchema.index({ 'location.city': 1 });
exports.CourtSchema.index({ ownerId: 1 });
exports.CourtSchema.index({ averageRating: -1 });
//# sourceMappingURL=court.schema.js.map