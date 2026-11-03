import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { CuentaService } from './cuenta.service';
import { modeloEnMemoria } from '../../test-utils/modelo-memoria';
import { configCon } from '../../test-utils/config';

describe('CuentaService', () => {
  let users: any;
  let notifications: Record<string, jest.Mock>;
  let auth: Record<string, jest.Mock>;
  let service: CuentaService;
  let ana: any;

  beforeEach(async () => {
    users = modeloEnMemoria();
    ana = {
      _id: new Types.ObjectId(), name: 'Ana', email: 'ana@club.com', isActive: true,
      passwordHash: await bcrypt.hash('Temporal1', 4), debeCambiarClave: true, refreshToken: 'x',
    };
    users.docs.push(ana);
    notifications = { sendRecuperarClave: jest.fn(async () => true) };
    auth = { emitirSesion: jest.fn(async (u: any) => ({ accessToken: 'a', user: { email: u.email } })) };
    service = new CuentaService(users, notifications as any, auth as any, configCon({
      FRONTEND_URL: 'https://reservatucancha.site',
      GOOGLE_CLIENT_IDS: 'web-id.apps.googleusercontent.com, android-id',
    }));
  });

  const tokenDelCorreo = () => {
    const url: string = notifications.sendRecuperarClave.mock.calls.at(-1)[0].url;
    expect(url).toMatch(/^https:\/\/reservatucancha\.site\/auth\/restablecer\?token=/);
    return decodeURIComponent(url.split('token=')[1]);
  };

  describe('recuperar la contraseña', () => {
    it('manda el enlace y guarda solo el hash del token', async () => {
      await service.olvide('ANA@club.com ');
      const token = tokenDelCorreo();
      expect(ana.resetClaveHash).toBeDefined();
      expect(ana.resetClaveHash).not.toBe(token);
      expect(ana.resetClaveVence.getTime()).toBeGreaterThan(Date.now());
    });

    it('si el correo no sale, avisa en vez de decir "revisa tu correo" y no deja token', async () => {
      notifications.sendRecuperarClave.mockResolvedValueOnce(false);
      await expect(service.olvide('ana@club.com')).rejects.toThrow('No pudimos enviar el correo');
      expect(ana.resetClaveHash).toBeUndefined();
    });

    it('responde igual si el correo no existe, sin mandar nada', async () => {
      const r1 = await service.olvide('nadie@x.com');
      await service.olvide('ana@club.com');
      const r2 = notifications.sendRecuperarClave.mock.calls.length;
      expect(r1).toEqual(await service.olvide('otro@x.com'));
      expect(r2).toBe(1);
    });

    it('el enlace pone la clave nueva, cierra las sesiones y no sirve dos veces', async () => {
      await service.olvide('ana@club.com');
      const token = tokenDelCorreo();
      await service.restablecer(token, 'NuevaClave9');
      expect(await bcrypt.compare('NuevaClave9', ana.passwordHash)).toBe(true);
      expect(ana.debeCambiarClave).toBe(false);
      expect(ana.refreshToken).toBeUndefined();
      await expect(service.restablecer(token, 'OtraClave9')).rejects.toThrow('venció o ya se usó');
    });

    it('un enlace vencido no sirve', async () => {
      await service.olvide('ana@club.com');
      const token = tokenDelCorreo();
      ana.resetClaveVence = new Date(Date.now() - 1000);
      await expect(service.restablecer(token, 'NuevaClave9')).rejects.toThrow(BadRequestException);
    });

    it('exige 8 caracteres con letra y número', async () => {
      await expect(service.restablecer('t', 'corta1')).rejects.toThrow('8 caracteres');
      await expect(service.restablecer('t', 'solamenteletras')).rejects.toThrow('una letra y un número');
    });
  });

  describe('cambiar la contraseña desde el panel', () => {
    it('pide la actual y quita el aviso de clave temporal', async () => {
      await expect(service.cambiarClave(String(ana._id), 'mala', 'NuevaClave9')).rejects.toThrow('actual no es correcta');
      await service.cambiarClave(String(ana._id), 'Temporal1', 'NuevaClave9');
      expect(await bcrypt.compare('NuevaClave9', ana.passwordHash)).toBe(true);
      expect(ana.debeCambiarClave).toBe(false);
    });
  });

  describe('entrar con Google', () => {
    const respuestaGoogle = (info: Record<string, unknown>, ok = true) =>
      jest.spyOn(global, 'fetch' as any).mockResolvedValue({ ok, json: async () => info } as any);
    const valido = {
      aud: 'web-id.apps.googleusercontent.com', iss: 'https://accounts.google.com',
      email: 'Ana@club.com', email_verified: 'true', exp: String(Math.floor(Date.now() / 1000) + 600),
    };

    afterEach(() => jest.restoreAllMocks());

    it('abre la sesión de la cuenta con ese correo', async () => {
      respuestaGoogle(valido);
      expect(await service.google('id-token')).toMatchObject({ accessToken: 'a' });
      expect(auth.emitirSesion).toHaveBeenCalledWith(expect.objectContaining({ email: 'ana@club.com' }));
    });

    it('no acepta tokens de otra app, sin verificar o vencidos', async () => {
      for (const malo of [
        { ...valido, aud: 'otra-app' },
        { ...valido, email_verified: 'false' },
        { ...valido, exp: '1' },
      ]) {
        respuestaGoogle(malo);
        await expect(service.google('id-token')).rejects.toThrow(UnauthorizedException);
      }
    });

    it('no crea cuentas: un correo sin panel no entra', async () => {
      respuestaGoogle({ ...valido, email: 'desconocido@gmail.com' });
      await expect(service.google('id-token')).rejects.toThrow('no tiene acceso al panel');
    });

    it('sin GOOGLE_CLIENT_IDS queda apagado', async () => {
      const apagado = new CuentaService(users, notifications as any, auth as any, configCon());
      expect(apagado.googleActivo).toBe(false);
      await expect(apagado.google('x')).rejects.toThrow('no está disponible');
    });
  });
});
