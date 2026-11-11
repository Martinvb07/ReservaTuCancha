import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { CourtsService } from '../courts/courts.service';
import { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly courtsService: CourtsService,
    private readonly configService: ConfigService,
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

    return this.emitirSesion(user);
  }

  /**
   * Abre la sesión de un usuario ya autenticado (por clave o por Google):
   * tokens nuevos, refresh guardado con hash y los datos que usan la web y
   * la app.
   */
  async emitirSesion(user: any) {
    if (user.role === UserRole.STAFF && !(await this.clubActivo(user))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.usersService.updateLastLogin(user._id.toString());

    const tokens = await this.generateTokens(user);

    // Guardar refresh token hasheado en la DB
    const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 10);
    await this.usersService.updateRefreshToken(user._id.toString(), hashedRefresh);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        /* El empleado usa el panel del club: para la web y la app es un
           "owner" con `esStaff`, y las pantallas sensibles se esconden. */
        role: user.role === UserRole.STAFF ? UserRole.OWNER : user.role,
        esStaff: user.role === UserRole.STAFF,
        ...(user.role === UserRole.STAFF ? { rolEquipo: (user as any).rolEquipo ?? 'encargado' } : {}),
        /* Entró con la clave temporal del correo: la web y la app lo llevan
           a ponerse una propia antes de usar el panel. */
        debeCambiarClave: !!user.debeCambiarClave,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async refresh(refreshToken: string) {
    // Decodificar el refresh token
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Token inválido');
    }

    const user = await this.usersService.findByIdWithRefreshToken(payload.sub);
    if (!user || !user.isActive || !user.refreshToken) {
      throw new UnauthorizedException('Sesión inválida');
    }
    if (user.role === UserRole.STAFF && !(await this.clubActivo(user))) {
      throw new UnauthorizedException('Sesión inválida');
    }

    // Verificar que el refresh token coincida con el guardado
    const matches = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!matches) {
      throw new UnauthorizedException('Refresh token revocado');
    }

    // Generar nuevos tokens (rotation)
    const tokens = await this.generateTokens(user);
    const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 10);
    await this.usersService.updateRefreshToken(user._id.toString(), hashedRefresh);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
    return { message: 'Sesión cerrada' };
  }

  async validateToken(userId: string) {
    return this.usersService.findById(userId);
  }

  private async clubActivo(staff: any): Promise<boolean> {
    if (!staff.clubOwnerId) return false;
    const dueno = await this.usersService.findById(staff.clubOwnerId.toString()).catch(() => null);
    return !!dueno && (dueno as any).isActive !== false && (dueno as any).role === UserRole.OWNER;
  }

  private async generateTokens(user: any) {
    const esStaff = user.role === UserRole.STAFF;
    const payload: Record<string, unknown> = {
      sub: user._id.toString(),
      email: user.email,
      /* El empleado actúa sobre el club de su dueño: ve y toca lo mismo que
         él salvo lo que bloquea SoloTitularGuard (cuenta de pagos, equipo). */
      role: esStaff ? UserRole.OWNER : user.role,
      name: user.name,
      ...(esStaff ? { staff: true, ownerId: user.clubOwnerId?.toString(), rolEquipo: user.rolEquipo ?? 'encargado' } : {}),
    };

    const accessToken = this.jwtService.sign(
      { ...payload, type: 'access' },
      { expiresIn: '15m' },
    );

    const refreshToken = this.jwtService.sign(
      { sub: payload.sub, type: 'refresh' },
      { expiresIn: '7d' },
    );

    return { accessToken, refreshToken };
  }
}
