import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    /* Ambos tokens se firman con el mismo secreto y solo los distingue este
       campo. Sin revisarlo, el refresh token servia como access token: siete
       dias de acceso en vez de quince minutos. */
    if (payload?.type !== 'access') {
      throw new UnauthorizedException('Token no valido para esta operacion');
    }

    /* `userId` es siempre el dueño del club sobre el que se actúa: así todas
       las rutas del panel sirven igual para el dueño y para sus empleados.
       `cuentaId` es quien inició sesión de verdad. */
    const esStaff = payload.staff === true && !!payload.ownerId;
    return {
      userId: esStaff ? payload.ownerId : payload.sub,
      cuentaId: payload.sub,
      esStaff,
      email: payload.email,
      role: payload.role,
      name: payload.name,
      courtIds: payload.courtIds || [],
    };
  }
}
