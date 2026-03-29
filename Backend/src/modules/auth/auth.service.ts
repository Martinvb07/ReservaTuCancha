
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { CourtsService } from '../courts/courts.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly courtsService: CourtsService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Actualizar último login
    await this.usersService.updateLastLogin(user._id.toString());

    let courtIds: string[] = [];
    if (user.role === 'owner') {
      const courts = await this.courtsService.findByOwner(user._id.toString());
      courtIds = courts.map((court) => court._id.toString());
    }

    const payload: any = {
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

  async validateToken(userId: string) {
    return this.usersService.findById(userId);
  }
}
