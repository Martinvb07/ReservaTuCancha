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
exports.SolicitudesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bcrypt = require("bcryptjs");
const solicitudes_schema_1 = require("./solicitudes.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const notifications_service_1 = require("../notifications/notifications.service");
let SolicitudesService = class SolicitudesService {
    constructor(solicitudModel, userModel, notificationsService) {
        this.solicitudModel = solicitudModel;
        this.userModel = userModel;
        this.notificationsService = notificationsService;
    }
    async crearSolicitud(data) {
        const solicitud = new this.solicitudModel(data);
        return solicitud.save();
    }
    async listarSolicitudes() {
        return this.solicitudModel.find().sort({ createdAt: -1 });
    }
    async aprobar(id) {
        const solicitud = await this.solicitudModel.findById(id);
        if (!solicitud)
            throw new common_1.NotFoundException('Solicitud no encontrada');
        const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        const user = new this.userModel({
            name: `${solicitud.firstName} ${solicitud.lastName}`,
            email: solicitud.email.toLowerCase(),
            passwordHash,
            role: 'owner',
            phone: solicitud.phone,
            isActive: true,
        });
        await user.save();
        solicitud.estado = 'aprobada';
        await solicitud.save();
        await this.notificationsService.sendApprovalEmail(solicitud.email, `${solicitud.firstName} ${solicitud.lastName}`, tempPassword);
        return { message: 'Solicitud aprobada y credenciales enviadas', email: solicitud.email };
    }
    async rechazar(id) {
        const solicitud = await this.solicitudModel.findById(id);
        if (!solicitud)
            throw new common_1.NotFoundException('Solicitud no encontrada');
        solicitud.estado = 'rechazada';
        await solicitud.save();
        await this.notificationsService.sendRejectionEmail(solicitud.email, `${solicitud.firstName} ${solicitud.lastName}`);
        return { message: 'Solicitud rechazada' };
    }
    async reenviarCredenciales(id) {
        const solicitud = await this.solicitudModel.findById(id);
        if (!solicitud)
            throw new common_1.NotFoundException('Solicitud no encontrada');
        if (solicitud.estado !== 'aprobada')
            throw new common_1.NotFoundException('La solicitud no está aprobada');
        const tempPassword = Math.random().toString(36).slice(-8) + 'B2!';
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        await this.userModel.findOneAndUpdate({ email: solicitud.email.toLowerCase() }, { passwordHash });
        await this.notificationsService.sendApprovalEmail(solicitud.email, `${solicitud.firstName} ${solicitud.lastName}`, tempPassword);
        return { message: 'Credenciales reenviadas' };
    }
};
exports.SolicitudesService = SolicitudesService;
exports.SolicitudesService = SolicitudesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(solicitudes_schema_1.Solicitud.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        notifications_service_1.NotificationsService])
], SolicitudesService);
//# sourceMappingURL=solicitudes.service.js.map