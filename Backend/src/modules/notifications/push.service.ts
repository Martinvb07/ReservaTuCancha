import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { createSign } from 'crypto';
import { DispositivoPush, DispositivoPushDocument } from './schemas/dispositivo-push.schema';

export interface AvisoPush {
  titulo: string;
  cuerpo: string;
  /** Lo que la app lee al tocar el aviso: a qué pantalla ir. Solo texto. */
  datos?: Record<string, string>;
}

interface CuentaServicio {
  project_id: string;
  client_email: string;
  private_key: string;
}

/**
 * Notificaciones push con Firebase Cloud Messaging (API HTTP v1).
 *
 * Se habla con la API directo, sin firebase-admin: lo único que hace falta es
 * firmar un JWT con la cuenta de servicio para pedir el token de acceso.
 *
 * La cuenta de servicio va en FIREBASE_SERVICE_ACCOUNT, como JSON o en base64.
 * Sin ella el servicio queda apagado y cada envío es un no-op: los correos
 * siguen saliendo igual.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private cuenta: CuentaServicio | null | undefined;
  private acceso: { token: string; vence: number } | null = null;

  constructor(
    private readonly config: ConfigService,
    @InjectModel(DispositivoPush.name) private readonly dispositivoModel: Model<DispositivoPushDocument>,
  ) {}

  get activo(): boolean {
    return !!this.cuentaServicio();
  }

  private cuentaServicio(): CuentaServicio | null {
    if (this.cuenta !== undefined) return this.cuenta;
    const crudo = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT')?.trim();
    this.cuenta = null;
    if (!crudo) return null;
    try {
      const texto = crudo.startsWith('{') ? crudo : Buffer.from(crudo, 'base64').toString('utf8');
      const json = JSON.parse(texto);
      if (json.project_id && json.client_email && json.private_key) {
        this.cuenta = {
          project_id: json.project_id,
          client_email: json.client_email,
          // En un .env los saltos de línea de la llave suelen quedar como "\n".
          private_key: String(json.private_key).replace(/\\n/g, '\n'),
        };
      } else {
        this.logger.error('FIREBASE_SERVICE_ACCOUNT no trae project_id, client_email y private_key');
      }
    } catch {
      this.logger.error('FIREBASE_SERVICE_ACCOUNT no es un JSON válido (ni en base64)');
    }
    return this.cuenta;
  }

  /** Token OAuth de la cuenta de servicio; dura una hora y se reusa. */
  private async tokenDeAcceso(cuenta: CuentaServicio): Promise<string> {
    if (this.acceso && this.acceso.vence > Date.now() + 60_000) return this.acceso.token;

    const ahora = Math.floor(Date.now() / 1000);
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const sinFirma = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
      iss: cuenta.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: ahora,
      exp: ahora + 3600,
    })}`;
    const firma = createSign('RSA-SHA256').update(sinFirma).sign(cuenta.private_key).toString('base64url');

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: `${sinFirma}.${firma}`,
      }),
    });
    const json: any = await res.json().catch(() => null);
    if (!res.ok || !json?.access_token) {
      throw new Error(`Google rechazó la cuenta de servicio: HTTP ${res.status} ${json?.error ?? ''}`);
    }
    this.acceso = { token: json.access_token, vence: Date.now() + (json.expires_in ?? 3600) * 1000 };
    return this.acceso.token;
  }

  /**
   * Envía el aviso a cada token. Nunca lanza: un push que no sale no puede
   * tumbar la confirmación de un pago. Los tokens que Firebase da por muertos
   * se borran para no seguir intentando.
   */
  async enviar(tokens: (string | undefined | null)[], aviso: AvisoPush): Promise<number> {
    const cuenta = this.cuentaServicio();
    const unicos = [...new Set(tokens.filter((t): t is string => !!t && t.length > 20))];
    if (!cuenta || !unicos.length) return 0;

    let token: string;
    try {
      token = await this.tokenDeAcceso(cuenta);
    } catch (e) {
      this.logger.error(`Push apagado en este envío: ${e.message}`);
      return 0;
    }

    const url = `https://fcm.googleapis.com/v1/projects/${cuenta.project_id}/messages:send`;
    let enviados = 0;
    await Promise.all(unicos.map(async (destino) => {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            message: {
              token: destino,
              notification: { title: aviso.titulo, body: aviso.cuerpo },
              data: aviso.datos ?? {},
              android: { priority: 'HIGH', notification: { channel_id: 'reservas', sound: 'default' } },
              apns: { payload: { aps: { sound: 'default' } } },
            },
          }),
        });
        if (res.ok) {
          enviados++;
          return;
        }
        const json: any = await res.json().catch(() => null);
        const codigo = json?.error?.details?.find((d: any) => d?.errorCode)?.errorCode ?? json?.error?.status;
        if (res.status === 404 || codigo === 'UNREGISTERED' || codigo === 'INVALID_ARGUMENT') {
          await this.dispositivoModel.deleteOne({ token: destino }).catch(() => undefined);
          return;
        }
        this.logger.warn(`FCM respondió ${res.status} (${codigo ?? 'sin código'})`);
      } catch (e) {
        this.logger.warn(`Push no enviado: ${e.message}`);
      }
    }));
    return enviados;
  }

  /** Avisa a todos los teléfonos registrados del club. */
  async enviarAlClub(ownerId: string, aviso: AvisoPush): Promise<number> {
    if (!this.activo || !Types.ObjectId.isValid(ownerId)) return 0;
    const dispositivos = await this.dispositivoModel
      .find({ userId: new Types.ObjectId(ownerId) })
      .select('token')
      .lean();
    return this.enviar(dispositivos.map((d) => d.token), aviso);
  }

  async registrar(datos: { token: string; plataforma?: string; ownerId: string; cuentaId?: string }) {
    await this.dispositivoModel.updateOne(
      { token: datos.token },
      {
        $set: {
          userId: new Types.ObjectId(datos.ownerId),
          cuentaId: datos.cuentaId && Types.ObjectId.isValid(datos.cuentaId)
            ? new Types.ObjectId(datos.cuentaId)
            : undefined,
          plataforma: datos.plataforma ?? 'android',
        },
      },
      { upsert: true },
    );
    return { ok: true };
  }

  async olvidar(token: string) {
    await this.dispositivoModel.deleteOne({ token });
    return { ok: true };
  }
}
