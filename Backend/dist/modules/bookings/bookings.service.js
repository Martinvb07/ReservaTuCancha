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
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const uuid_1 = require("uuid");
const booking_schema_1 = require("./schemas/booking.schema");
const notifications_service_1 = require("../notifications/notifications.service");
let BookingsService = class BookingsService {
    constructor(bookingModel, notificationsService) {
        this.bookingModel = bookingModel;
        this.notificationsService = notificationsService;
    }
    async create(createBookingDto) {
        const conflict = await this.bookingModel.findOne({
            courtId: createBookingDto.courtId,
            date: new Date(createBookingDto.date),
            startTime: createBookingDto.startTime,
            status: { $in: [booking_schema_1.BookingStatus.PENDING, booking_schema_1.BookingStatus.CONFIRMED] },
        });
        if (conflict)
            throw new common_1.ConflictException('El horario seleccionado ya no está disponible');
        const booking = new this.bookingModel({
            ...createBookingDto,
            cancelToken: (0, uuid_1.v4)(),
            reviewToken: (0, uuid_1.v4)(),
            status: booking_schema_1.BookingStatus.PENDING,
        });
        const saved = await booking.save();
        await this.notificationsService.sendBookingConfirmation(saved);
        return saved;
    }
    async findById(id) {
        const booking = await this.bookingModel
            .findById(id)
            .populate('courtId', 'name sport location pricePerHour')
            .lean();
        if (!booking)
            throw new common_1.NotFoundException('Reserva no encontrada');
        return booking;
    }
    async findByCancelToken(token) {
        const booking = await this.bookingModel
            .findOne({ cancelToken: token })
            .populate('courtId', 'name sport location')
            .lean();
        if (!booking)
            throw new common_1.NotFoundException('Token inválido o reserva no encontrada');
        if (booking.status === booking_schema_1.BookingStatus.CANCELLED)
            throw new common_1.BadRequestException('Esta reserva ya fue cancelada');
        return booking;
    }
    async confirmPayment(bookingId) {
        const booking = await this.bookingModel.findByIdAndUpdate(bookingId, { status: booking_schema_1.BookingStatus.CONFIRMED }, { new: true });
        if (!booking)
            throw new common_1.NotFoundException('Reserva no encontrada');
        return booking;
    }
    async cancelByToken(token) {
        const booking = await this.bookingModel.findOne({ cancelToken: token });
        if (!booking)
            throw new common_1.NotFoundException('Token de cancelación inválido');
        if (booking.status === booking_schema_1.BookingStatus.CANCELLED)
            throw new common_1.BadRequestException('Esta reserva ya fue cancelada');
        const hoursUntilBooking = (new Date(booking.date).getTime() - Date.now()) / 1000 / 60 / 60;
        if (hoursUntilBooking < 2)
            throw new common_1.BadRequestException('No se puede cancelar con menos de 2 horas de anticipación');
        booking.status = booking_schema_1.BookingStatus.CANCELLED;
        await booking.save();
        await this.notificationsService.sendCancellationConfirmation(booking);
        return { message: 'Reserva cancelada exitosamente' };
    }
    async updateStatus(id, status) {
        const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
        if (!validStatuses.includes(status))
            throw new common_1.BadRequestException('Estado inválido');
        const booking = await this.bookingModel.findByIdAndUpdate(id, { status }, { new: true }).populate('courtId', 'name sport');
        if (!booking)
            throw new common_1.NotFoundException('Reserva no encontrada');
        if (status === 'completed') {
            await this.notificationsService.sendReviewRequest(booking);
        }
        return booking;
    }
    async findByCourtAndDate(courtId, date) {
        return this.bookingModel
            .find({
            courtId,
            date: new Date(date),
            status: { $in: [booking_schema_1.BookingStatus.PENDING, booking_schema_1.BookingStatus.CONFIRMED] },
        })
            .select('startTime endTime status')
            .lean();
    }
    async findByOwner(ownerCourtIds) {
        return this.bookingModel
            .find({ courtId: { $in: ownerCourtIds } })
            .populate('courtId', 'name sport')
            .sort({ date: -1 })
            .lean();
    }
    async findAll(page = 1, limit = 20, guestEmail) {
        const skip = (page - 1) * limit;
        const filter = {};
        if (guestEmail)
            filter.guestEmail = { $regex: guestEmail, $options: 'i' };
        const [data, total] = await Promise.all([
            this.bookingModel.find(filter)
                .populate('courtId', 'name sport')
                .skip(skip).limit(limit)
                .sort({ createdAt: -1 }).lean(),
            this.bookingModel.countDocuments(filter),
        ]);
        return { data, total, page, limit };
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(booking_schema_1.Booking.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        notifications_service_1.NotificationsService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map