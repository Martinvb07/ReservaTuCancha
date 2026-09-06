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

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      name: payload.name,
      courtIds: payload.courtIds || [],
    };
  }
}
