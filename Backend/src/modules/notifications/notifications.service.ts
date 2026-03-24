// src/modules/notifications/notifications.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { Booking } from '../bookings/schemas/booking.schema';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly frontendUrl: string;
  private readonly fromEmail: string;
  private readonly resend: Resend;

  constructor(private readonly configService: ConfigService) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    this.fromEmail   = this.configService.get<string>('RESEND_FROM_EMAIL');
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
  }

  private async send(msg: { to: string; from: string; subject: string; html: string }) {
    try {
      // Capturamos la respuesta completa de Resend para validaciones
      const { data, error } = await this.resend.emails.send({
        to: msg.to,
        from: msg.from,
        subject: msg.subject,
        html: msg.html,
      });

      // Manejo de errores de la API (ej. dominios no verificados)
      if (error) {
        this.logger.error(`❌ Error de Resend API: ${error.name} - ${error.message}`);
        return;
      }

      this.logger.log(`✅ Email enviado exitosamente a ${msg.to}. ID: ${data?.id}`);
    } catch (error) {
      // Errores de red o de ejecución técnica
      this.logger.error(`❌ Error crítico enviando email: ${error.message}`);
    }
  }

  async sendBookingConfirmation(booking: Booking & { _id: any }) {
    const cancelUrl  = `${this.frontendUrl}/reservas/cancelar?token=${booking.cancelToken}`;
    const bookingDate = new Date(booking.date).toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    await this.send({
      to: booking.guestEmail,
      from: this.fromEmail,
      subject: `Gracias por tu Reserva — #${booking.bookingCode}`,
      html: `
        <div style="background-color: #f3f4f6; padding: 40px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 450px; background-color: #111827; border-radius: 32px; overflow: hidden; border-collapse: separate;">
            <tr>
              <td align="center" style="padding: 40px 30px;">
                <div style="background-color: #a3e635; width: 64px; height: 64px; border-radius: 50%; margin-bottom: 24px; display: table;">
                  <span style="display: table-cell; vertical-align: middle; font-size: 30px; color: #111827;">✓</span>
                </div>
                
                <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: -0.5px;">¡RESERVA CREADA!</h1>
                <p style="color: #9ca3af; font-size: 14px; margin-top: 10px; line-height: 20px;">
                  Gracias por reservar con nosotros, <strong>${booking.guestName}</strong>. Tu reserva fue creada exitosamente. Aquí tienes los detalles de tu reserva:
                </p>

                <div style="background-color: #1f2937; border-radius: 20px; padding: 20px; margin-top: 28px; border: 1px solid #374151;">
                  <span style="color: #9ca3af; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Código de Reserva</span>
                  <span style="color: #a3e635; font-size: 30px; font-weight: 800; letter-spacing: 2px;">#${booking.bookingCode}</span>
                </div>
              </td>
            </tr>

            <tr>
              <td style="background-color: #ffffff; padding: 40px 30px; border-radius: 32px 32px 0 0;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                  <tr style="height: 45px;">
                    <td style="color: #6b7280; font-size: 14px;">Cancha</td>
                    <td align="right" style="color: #111827; font-size: 14px; font-weight: 700;">Padel</td>
                  </tr>
                  <tr style="height: 45px;">
                    <td style="color: #6b7280; font-size: 14px;">Fecha</td>
                    <td align="right" style="color: #111827; font-size: 14px; font-weight: 700;">${bookingDate}</td>
                  </tr>
                  <tr style="height: 45px;">
                    <td style="color: #6b7280; font-size: 14px;">Horario</td>
                    <td align="right" style="color: #111827; font-size: 14px; font-weight: 700;">${booking.startTime} – ${booking.endTime}</td>
                  </tr>
                  <tr style="height: 65px;">
                    <td style="color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Total</td>
                    <td align="right" style="color: #059669; font-size: 18px; font-weight: 800; border-top: 1px solid #f3f4f6;">$${booking.totalPrice?.toLocaleString('es-CO')} COP</td>
                  </tr>
                </table>

                <div style="margin-top: 32px; text-align: center;">
                  <a href="${cancelUrl}" style="background-color: #ef4444; color: #ffffff; padding: 16px 32px; border-radius: 16px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                    Cancelar reserva
                  </a>
                  <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
                    Cancelación gratuita hasta 2 horas antes del turno.
                  </p>
                </div>
              </td>
            </tr>
          </table>
          <div style="text-align: center; margin-top: 24px; color: #9ca3af; font-size: 12px;">
             Enviado por <strong>ReservaTuCancha</strong>
          </div>
        </div>
      `,
    });
  }

  async sendCancellationConfirmation(booking: Booking & { _id: any }) {
    await this.send({
      to: booking.guestEmail,
      from: this.fromEmail,
      subject: '❌ Reserva cancelada — ReservaTuCancha',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #eee;border-radius:12px;">
          <h2 style="color:#dc2626;">Reserva cancelada</h2>
          <p>Hola <strong>${booking.guestName}</strong>, tu reserva fue cancelada exitosamente.</p>
          <p>Si realizaste un pago, el reembolso se procesará en 3-5 días hábiles.</p>
          <div style="margin-top:20px;">
            <a href="${this.frontendUrl}/empresas" style="color:#16a34a;font-weight:bold;">Ver otras canchas disponibles →</a>
          </div>
        </div>
      `,
    });
  }

  async sendReviewRequest(booking: Booking & { _id: any }) {
    const reviewUrl = `${this.frontendUrl}/resena?token=${booking.reviewToken}`;
    await this.send({
      to: booking.guestEmail,
      from: this.fromEmail,
      subject: '⭐ ¿Cómo estuvo tu experiencia? — ReservaTuCancha',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;text-align:center;padding:40px;background:#f9fafb;border-radius:16px;">
          <h2 style="color:#111827;">¡Gracias por jugar con nosotros!</h2>
          <p style="color:#4b5563;">Hola ${booking.guestName}, califica tu experiencia en la cancha.</p>
          <div style="margin:30px 0;">
            <a href="${reviewUrl}" style="background:#16a34a;color:white;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;">
              Dejar reseña ⭐
            </a>
          </div>
        </div>
      `,
    });
  }

  async sendApprovalEmail(email: string, name: string, tempPassword: string) {
    await this.send({
      to: email,
      from: this.fromEmail,
      subject: '🎉 ¡Tu cuenta fue aprobada! — ReservaTuCancha',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px;">
          <div style="background:#111827;padding:24px;border-radius:12px;text-align:center;margin-bottom:24px;">
            <h1 style="color:#a3e635;margin:0;">ReservaTuCancha</h1>
          </div>
          <h2 style="color:#16a34a;">¡Bienvenido, ${name}!</h2>
          <p>Tu solicitud fue aprobada. Usa estas credenciales para ingresar:</p>
          <div style="background:white;border-radius:8px;padding:20px;margin:16px 0;border:1px solid #e5e7eb;">
            <p style="margin:0 0 8px;"><strong>Email:</strong> ${email}</p>
            <p style="margin:0;"><strong>Contraseña temporal:</strong> <code style="background:#f0fdf4;padding:4px 8px;border-radius:4px;font-size:18px;">${tempPassword}</code></p>
          </div>
          <div style="text-align:center;margin:24px 0;">
            <a href="${this.frontendUrl}/auth/login" style="background:#16a34a;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
              Ingresar al panel →
            </a>
          </div>
        </div>
      `,
    });
  }

  async sendRejectionEmail(email: string, name: string) {
    await this.send({
      to: email,
      from: this.fromEmail,
      subject: 'Actualización sobre tu solicitud — ReservaTuCancha',
      html: `<p>Hola ${name}, revisamos tu solicitud y no pudimos aprobarla en este momento.</p>`,
    });
  }

  async sendChangelogNotification(titulo: string, descripcion: string, version?: string) {
    await this.send({
      to: this.fromEmail,
      from: this.fromEmail,
      subject: `📢 Nueva actualización: ${titulo}`,
      html: `<h2>${titulo} ${version || ''}</h2><p>${descripcion}</p>`,
    });
  }

  async sendAdminNotification({ subject, html }: { subject: string; html: string }) {
    await this.send({ to: this.fromEmail, from: this.fromEmail, subject, html });
  }
}