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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const users_service_1 = require("../users/users.service");
const courts_service_1 = require("../courts/courts.service");
let AuthService = class AuthService {
    constructor(usersService, jwtService, courtsService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.courtsService = courtsService;
    }
    async login(loginDto) {
        const user = await this.usersService.findByEmail(loginDto.email);
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        const passwordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
        if (!passwordValid) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        await this.usersService.updateLastLogin(user._id.toString());
        let courtIds = [];
        if (user.role === 'owner') {
            const courts = await this.courtsService.findByOwner(user._id.toString());
            courtIds = courts.map((court) => court._id.toString());
        }
        const payload = {
            sub: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
        };
        if (courtIds.length > 0) {
            payload.courtIds = courtIds;
        }
        return {
            accessToken: this.jwtService.sign(payload),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl,
                courtIds: courtIds,
            },
        };
    }
    async validateToken(userId) {
        return this.usersService.findById(userId);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        courts_service_1.CourtsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map