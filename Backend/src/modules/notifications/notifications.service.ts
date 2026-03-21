// src/modules/notifications/notifications.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { Booking } from '../bookings/schemas/booking.schema';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly frontendUrl: string;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    sgMail.setApiKey(this.configService.get<string>('SENDGRID_API_KEY'));
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    this.fromEmail   = this.configService.get<string>('SENDGRID_FROM_EMAIL');
  }

  private async send(msg: any) {
    try {
      await sgMail.send(msg);
      this.logger.log(`Email enviado a ${Array.isArray(msg.to) ? msg.to.join(', ') : msg.to}`);
    } catch (error) {
      this.logger.error(`Error enviando email: ${error.message}`);
    }
  }

  async sendBookingConfirmation(booking: Booking & { _id: any }) {
    const cancelUrl  = `${this.frontendUrl}/reservas/cancelar?token=${booking.cancelToken}`;
    const bookingDate = new Date(booking.date).toLocaleDateString('es-CO', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    await this.send({
      to: booking.guestEmail,
      from: this.fromEmail,
      subject: `✅ Reserva confirmada — ${bookingDate}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px;">
          <div style="background:#111827;padding:24px;border-radius:12px;text-align:center;margin-bottom:24px;">
            <h1 style="color:#a3e635;font-size:24px;margin:0;">ReservaTuCancha</h1>
          </div>
          <h2 style="color:#16a34a;">¡Tu reserva está confirmada!</h2>
          <p>Hola <strong>${booking.guestName}</strong>,</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;background:white;border-radius:8px;overflow:hidden;">
            <tr><td style="padding:12px;background:#f0fdf4;font-weight:bold;">Fecha</td><td style="padding:12px;">${bookingDate}</td></tr>
            <tr><td style="padding:12px;font-weight:bold;">Horario</td><td style="padding:12px;">${booking.startTime} – ${booking.endTime}</td></tr>
            <tr><td style="padding:12px;background:#f0fdf4;font-weight:bold;">Total</td><td style="padding:12px;color:#16a34a;font-weight:bold;">$${booking.totalPrice?.toLocaleString('es-CO')} COP</td></tr>
          </table>
          <div style="text-align:center;margin:24px 0;">
            <a href="${cancelUrl}" style="background:#dc2626;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
              Cancelar reserva
            </a>
          </div>
          <p style="color:#6b7280;font-size:12px;">Cancelación gratuita hasta 2 horas antes del turno.</p>
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
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#dc2626;">Reserva cancelada</h2>
          <p>Hola <strong>${booking.guestName}</strong>, tu reserva fue cancelada exitosamente.</p>
          <p>Si realizaste un pago, el reembolso se procesará en 3-5 días hábiles.</p>
          <p>¿Quieres reservar otra cancha? <a href="${this.frontendUrl}/empresas">Ver canchas disponibles</a></p>
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
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2>¡Gracias por reservar con nosotros!</h2>
          <p>Hola <strong>${booking.guestName}</strong>, esperamos que hayas disfrutado tu partido.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${reviewUrl}" style="background:#16a34a;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
              Dejar reseña ⭐
            </a>
          </div>
          <p style="color:#6b7280;font-size:12px;">Este link es de un solo uso y expira en 7 días.</p>
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
          <p>Tu solicitud fue aprobada. Ya puedes acceder a tu panel de propietario.</p>
          <div style="background:white;border-radius:8px;padding:20px;margin:16px 0;">
            <p style="margin:0 0 8px;"><strong>Email:</strong> ${email}</p>
            <p style="margin:0;"><strong>Contraseña temporal:</strong> <code style="background:#f0fdf4;padding:4px 8px;border-radius:4px;font-size:18px;letter-spacing:2px;">${tempPassword}</code></p>
          </div>
          <div style="text-align:center;margin:24px 0;">
            <a href="${this.frontendUrl}/auth/login" style="background:#16a34a;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
              Ingresar al panel →
            </a>
          </div>
          <p style="color:#dc2626;font-size:13px;">⚠️ Cambia tu contraseña en el primer inicio de sesión.</p>
        </div>
      `,
    });
  }

  async sendRejectionEmail(email: string, name: string) {
    await this.send({
      to: email,
      from: this.fromEmail,
      subject: 'Actualización sobre tu solicitud — ReservaTuCancha',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2>Hola ${name},</h2>
          <p>Revisamos tu solicitud y en este momento no podemos aprobarla.</p>
          <p>Si crees que hay un error o quieres más información, escríbenos a <a href="mailto:soporte@reservatucancha.co">soporte@reservatucancha.co</a>.</p>
        </div>
      `,
    });
  }

  async sendChangelogNotification(titulo: string, descripcion: string, version?: string) {
    // En producción esto enviaría a todos los owners de la BD
    // Por ahora notifica al admin
    await this.send({
      to: this.fromEmail,
      from: this.fromEmail,
      subject: `📢 Nueva actualización: ${titulo}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2>${titulo}${version ? ` — ${version}` : ''}</h2>
          <p>${descripcion}</p>
        </div>
      `,
    });
  }

  async sendAdminNotification({ subject, html }: { subject: string; html: string }) {
    await this.send({ to: this.fromEmail, from: this.fromEmail, subject, html });
  }
}