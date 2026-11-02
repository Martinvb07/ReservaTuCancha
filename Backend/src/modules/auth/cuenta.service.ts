import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../users/schemas/user.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthService } from './auth.service';

/** Una hora para usar el enlace de recuperación. */
const VIGENCIA_RESET_MS = 60 * 60 * 1000;

const hash = (token: string) => createHash('sha256').update(token).digest('hex');

/**
 * Lo que una cuenta del panel hace con su acceso: recuperar la contraseña
 * por correo, cambiarla y entrar con Google.
 *
 * Vive bajo /api/cuenta y no /api/auth porque en producción nginx manda
 * /api/auth al Next (ahí contesta next-auth).
 */
@Injectable()
export class CuentaService {
  private readonly logger = new Logger(CuentaService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly notifications: NotificationsService,
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  /** Reglas mínimas: 8 caracteres con al menos una letra y un número. */
  static validarClave(clave: string) {
    if (typeof clave !== 'string' || clave.length < 8 || clave.length > 128) {
      throw new BadRequestException('La contraseña debe tener al menos 8 caracteres');
    }
    if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(clave) || !/\d/.test(clave)) {
      throw new BadRequestException('La contraseña debe tener al menos una letra y un número');
    }
  }

  /**
   * Manda el enlace de recuperación. Responde lo mismo exista o no la cuenta:
   * si dijera "ese correo no existe", serviría para averiguar qué correos
   * tienen panel.
   */
  async olvide(email: string) {
    const correo = String(email ?? '').toLowerCase().trim();
    const user = correo ? await this.userModel.findOne({ email: correo, isActive: true }) : null;
    if (user) {
      const token = randomBytes(32).toString('base64url');
      await this.userModel.updateOne(
        { _id: user._id },
        { $set: { resetClaveHash: hash(token), resetClaveVence: new Date(Date.now() + VIGENCIA_RESET_MS) } },
      );
      const web = (this.config.get<string>('FRONTEND_URL') ?? 'https://reservatucancha.site').replace(/\/+$/, '');
      await this.notifications.sendRecuperarClave({
        email: user.email,
        nombre: user.name,
        url: `${web}/auth/restablecer?token=${encodeURIComponent(token)}`,
      });
      this.logger.log(`Enlace de recuperación enviado a la cuenta ${user._id}`);
    }
    return { ok: true, mensaje: 'Si el correo tiene una cuenta, te llegará un enlace para recuperarla.' };
  }

  /** Pone la contraseña nueva con el token del correo. El token se gasta. */
  async restablecer(token: string, clave: string) {
    CuentaService.validarClave(clave);
    if (!token) throw new BadRequestException('El enlace no es válido');

    const user = await this.userModel
      .findOne({ resetClaveHash: hash(token), resetClaveVence: { $gt: new Date() } })
      .select('+resetClaveHash +resetClaveVence');
    if (!user) throw new BadRequestException('El enlace venció o ya se usó. Pide uno nuevo.');

    await this.userModel.updateOne(
      { _id: user._id },
      {
        $set: { passwordHash: await bcrypt.hash(clave, 10), debeCambiarClave: false },
        /* Se cierran las sesiones abiertas: si alguien tenía la clave vieja,
           queda afuera. */
        $unset: { resetClaveHash: 1, resetClaveVence: 1, refreshToken: 1 },
      },
    );
    return { ok: true };
  }

  /** Cambio desde el panel, sabiendo la contraseña actual. */
  async cambiarClave(cuentaId: string, actual: string, nueva: string) {
    CuentaService.validarClave(nueva);
    const user = await this.userModel.findById(cuentaId).select('+passwordHash');
    if (!user) throw new UnauthorizedException('Sesión inválida');
    if (!(await bcrypt.compare(String(actual ?? ''), user.passwordHash))) {
      throw new BadRequestException('La contraseña actual no es correcta');
    }
    if (actual === nueva) throw new BadRequestException('La nueva tiene que ser distinta de la actual');
    await this.userModel.updateOne(
      { _id: user._id },
      { $set: { passwordHash: await bcrypt.hash(nueva, 10), debeCambiarClave: false } },
    );
    return { ok: true };
  }

  /** Los client IDs de Google aceptados (web, Android, iOS), separados por coma. */
  private get googleClientIds(): string[] {
    return String(this.config.get('GOOGLE_CLIENT_IDS') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  get googleActivo() {
    return this.googleClientIds.length > 0;
  }

  /**
   * Entrar con Google. Google confirma el correo; la cuenta tiene que existir
   * ya (los clubes entran por solicitud aprobada), así que no se crea nada.
   */
  async google(idToken: string) {
    if (!this.googleActivo) throw new BadRequestException('El ingreso con Google no está disponible');
    if (!idToken) throw new UnauthorizedException('Token de Google inválido');

    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    const info: any = await res.json().catch(() => null);
    const valido =
      res.ok &&
      info &&
      this.googleClientIds.includes(info.aud) &&
      ['accounts.google.com', 'https://accounts.google.com'].includes(info.iss) &&
      String(info.email_verified) === 'true' &&
      Number(info.exp) * 1000 > Date.now();
    if (!valido) throw new UnauthorizedException('No pudimos verificar tu cuenta de Google');

    const user = await this.userModel.findOne({ email: String(info.email).toLowerCase(), isActive: true });
    if (!user) {
      throw new UnauthorizedException(
        'Ese correo de Google no tiene acceso al panel. Entra con el correo con el que se aprobó tu club o solicita acceso.',
      );
    }
    return this.auth.emitirSesion(user);
  }
}
