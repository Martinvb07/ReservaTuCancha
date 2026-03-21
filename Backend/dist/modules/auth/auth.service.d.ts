import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { CourtsService } from '../courts/courts.service';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly courtsService;
    constructor(usersService: UsersService, jwtService: JwtService, courtsService: CourtsService);
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            role: import("../users/schemas/user.schema").UserRole;
            avatarUrl: string;
            courtIds: string[];
        };
    }>;
    validateToken(userId: string): Promise<import("../users/schemas/user.schema").UserDocument>;
}
