// src/modules/notifications/notifications.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { Booking } from '../bookings/schemas/booking.schema';
import { CourtsService } from '../courts/courts.service';
import { ClubsService } from '../clubs/clubs.service';

// ─── Helpers ────────────────────────────────────────────────────────────────

function toAmPm(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatSport(sport: string): string {
  if (!sport) return '-';
  return sport.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function formatDateCO(date: Date): string {
  return new Date(date).toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'America/Bogota',
  });
}

function formatPrice(price: number): string {
  return `$${price?.toLocaleString('es-CO')} COP`;
}

// ─── Email template base ────────────────────────────────────────────────────

interface EmailTemplateOptions {
  iconBg: string;       // color del círculo del ícono
  iconContent: string;  // contenido del ícono (emoji o carácter)
  iconColor?: string;   // color del texto del ícono
  title: string;
  subtitle: string;
  badgeCode?: string;
  badgeLabel?: string;
  badgeColor?: string;
  rows: { label: string; value: string; highlight?: boolean }[];
  ctaText?: string;
  ctaUrl?: string;
  ctaBg?: string;
  ctaNote?: string;
  alertBox?: { bg: string; color: string; text: string };
  secondaryCta?: { text: string; url: string };
  footer?: string;
}

function buildEmailHtml(opts: EmailTemplateOptions): string {
  const iconColor = opts.iconColor || '#111827';
  const badgeColor = opts.badgeColor || '#a3e635';
  const ctaBg = opts.ctaBg || '#16a34a';

  const rowsHtml = opts.rows.map(r => `
    <tr style="height: ${r.highlight ? '65px' : '45px'};">
      <td style="color: #6b7280; font-size: 14px;${r.highlight ? ' border-top: 1px solid #f3f4f6;' : ''}">${r.label}</td>
      <td align="right" style="color: ${r.highlight ? '#059669' : '#111827'}; font-size: ${r.highlight ? '18px' : '14px'}; font-weight: ${r.highlight ? '800' : '700'};${r.highlight ? ' border-top: 1px solid #f3f4f6;' : ''}">${r.value}</td>
    </tr>
  `).join('');

  const badgeHtml = opts.badgeCode ? `
    <div style="background-color: #1f2937; border-radius: 20px; padding: 20px; margin-top: 28px; border: 1px solid #374151;">
      <span style="color: #9ca3af; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">${opts.badgeLabel || 'Código de Reserva'}</span>
      <span style="color: ${badgeColor}; font-size: 30px; font-weight: 800; letter-spacing: 2px;">#${opts.badgeCode}</span>
    </div>
  ` : '';

  const alertHtml = opts.alertBox ? `
    <div style="margin-top: 20px; background-color: ${opts.alertBox.bg}; border-radius: 12px; padding: 16px; text-align: center;">
      <p style="color: ${opts.alertBox.color}; font-size: 13px; margin: 0; font-weight: 600;">${opts.alertBox.text}</p>
    </div>
  ` : '';

  const ctaHtml = opts.ctaText && opts.ctaUrl ? `
    <div style="margin-top: 32px; text-align: center;">
      <a href="${opts.ctaUrl}" style="background-color: ${ctaBg}; color: #ffffff; padding: 16px 32px; border-radius: 16px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        ${opts.ctaText}
      </a>
      ${opts.ctaNote ? `<p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">${opts.ctaNote}</p>` : ''}
    </div>
  ` : '';

  const secondaryHtml = opts.secondaryCta ? `
    <div style="margin-top: 16px; text-align: center;">
      <a href="${opts.secondaryCta.url}" style="color: #6b7280; font-size: 13px; text-decoration: underline;">${opts.secondaryCta.text}</a>
    </div>
  ` : '';

  return `
    <div style="background-color: #f3f4f6; padding: 40px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 450px; background-color: #111827; border-radius: 32px; overflow: hidden; border-collapse: separate;">
        <tr>
          <td align="center" style="padding: 40px 30px;">
            <div style="background-color: ${opts.iconBg}; width: 64px; height: 64px; border-radius: 50%; margin-bottom: 24px; display: table;">
              <span style="display: table-cell; vertical-align: middle; font-size: 30px; color: ${iconColor};">${opts.iconContent}</span>
            </div>
            <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: -0.5px;">${opts.title}</h1>
            <p style="color: #9ca3af; font-size: 14px; margin-top: 10px; line-height: 20px;">${opts.subtitle}</p>
            ${badgeHtml}
          </td>
        </tr>
        <tr>
          <td style="background-color: #ffffff; padding: 40px 30px; border-radius: 32px 32px 0 0;">
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
              ${rowsHtml}
            </table>
            ${alertHtml}
            ${ctaHtml}
            ${secondaryHtml}
          </td>
        </tr>
      </table>
      <div style="text-align: center; margin-top: 24px; color: #9ca3af; font-size: 12px;">
        ${opts.footer || 'Enviado por <strong>ReservaTuCancha</strong>'}
      </div>
    </div>
  `;
}

// ─── Service ────────────────────────────────────────────────────────────────

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly frontendUrl: string;
  private readonly fromEmail: string;
  private readonly adminEmail: string;
  private readonly resend: Resend;

  constructor(
    private readonly configService: ConfigService,
    private readonly courtsService: CourtsService,
    private readonly clubsService: ClubsService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    this.fromEmail   = this.configService.get<string>('RESEND_FROM_EMAIL');
    this.adminEmail  = this.configService.get<string>('ADMIN_NOTIFY_EMAIL', 'martinvelasquezdev@gmail.com');
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
  }

  private async send(msg: { to: string; from: string; subject: string; html: string }) {
    try {
      const { data, error } = await this.resend.emails.send({
        to: msg.to, from: msg.from, subject: msg.subject, html: msg.html,
      });
      if (error) {
        this.logger.error(`Error de Resend API: ${error.name} - ${error.message}`);
        return;
      }
      this.logger.log(`Email enviado a ${msg.to}. ID: ${data?.id}`);
    } catch (error) {
      this.logger.error(`Error critico enviando email: ${error.message}`);
    }
  }

  private async getCourtAndClub(booking: Booking & { _id: any }) {
    const courtIdStr = (booking.courtId as any)?._id?.toString() ?? booking.courtId.toString();
    const court = await this.courtsService.findById(courtIdStr);
    let club = null;
    if (court && court.ownerId) {
      club = await this.clubsService['clubModel'].findOne({ ownerUserId: court.ownerId }).lean();
    }
    return { court, club };
  }

  // ─── CONFIRMACIÓN DE RESERVA ──────────────────────────────────────────

  async sendBookingConfirmation(booking: Booking & { _id: any }) {
    const { court, club } = await this.getCourtAndClub(booking);
    const cancelUrl = `${this.frontendUrl}/reservas/cancelar?token=${booking.cancelToken}`;

    await this.send({
      to: booking.guestEmail,
      from: this.fromEmail,
      subject: `Gracias por tu Reserva — #${booking.bookingCode}`,
      html: buildEmailHtml({
        iconBg: '#a3e635', iconContent: '✓',
        title: '¡RESERVA CREADA!',
        subtitle: `Gracias por reservar con nosotros, <strong>${booking.guestName}</strong>. Tu reserva fue creada exitosamente.`,
        badgeCode: booking.bookingCode,
        badgeColor: '#a3e635',
        rows: [
          { label: 'Club', value: club?.name || '-' },
          { label: 'Dirección', value: club?.address || '-' },
          { label: 'Deporte', value: formatSport(court?.sport) },
          { label: 'Fecha', value: formatDateCO(booking.date) },
          { label: 'Horario', value: `${toAmPm(booking.startTime)} – ${toAmPm(booking.endTime)}` },
          { label: 'Total', value: formatPrice(booking.totalPrice), highlight: true },
        ],
        ctaText: 'Cancelar reserva', ctaUrl: cancelUrl, ctaBg: '#ef4444',
        ctaNote: 'Cancelación gratuita hasta 2 horas antes del turno.',
      }),
    });
  }

  // ─── RESERVA PENDIENTE (EFECTIVO) ─────────────────────────────────────

  async sendBookingPendingCash(booking: Booking & { _id: any }) {
    const { court, club } = await this.getCourtAndClub(booking);
    const cancelUrl = `${this.frontendUrl}/reservas/cancelar?token=${booking.cancelToken}`;

    await this.send({
      to: booking.guestEmail,
      from: this.fromEmail,
      subject: `Reserva pendiente de pago — #${booking.bookingCode}`,
      html: buildEmailHtml({
        iconBg: '#f59e0b', iconContent: '$', iconColor: '#111827',
        title: 'RESERVA CREADA',
        subtitle: `Hola <strong>${booking.guestName}</strong>, tu reserva fue registrada exitosamente. Recuerda llevar el valor en efectivo el día de tu visita.`,
        badgeCode: booking.bookingCode,
        badgeLabel: 'Código de Reserva',
        badgeColor: '#f59e0b',
        rows: [
          { label: 'Club', value: club?.name || '-' },
          { label: 'Dirección', value: club?.address || '-' },
          { label: 'Fecha', value: formatDateCO(booking.date) },
          { label: 'Horario', value: `${toAmPm(booking.startTime)} – ${toAmPm(booking.endTime)}` },
          { label: 'Total a pagar', value: formatPrice(booking.totalPrice), highlight: true },
        ],
        alertBox: { bg: '#fef3c7', color: '#92400e', text: 'Pago en efectivo al llegar al lugar' },
        ctaText: 'Cancelar reserva', ctaUrl: cancelUrl, ctaBg: '#ef4444',
        ctaNote: 'Cancelación gratuita hasta 2 horas antes del turno.',
      }),
    });
  }

  // ─── CANCELACIÓN ──────────────────────────────────────────────────────

  async sendCancellationConfirmation(booking: Booking & { _id: any }) {
    const { court, club } = await this.getCourtAndClub(booking);

    await this.send({
      to: booking.guestEmail,
      from: this.fromEmail,
      subject: `Reserva cancelada — #${booking.bookingCode}`,
      html: buildEmailHtml({
        iconBg: '#ef4444', iconContent: '✕', iconColor: '#ffffff',
        title: 'RESERVA CANCELADA',
        subtitle: `Hola <strong>${booking.guestName}</strong>, tu reserva fue cancelada exitosamente. Si realizaste un pago, el reembolso se procesará en 3-5 días hábiles.`,
        badgeCode: booking.bookingCode,
        badgeLabel: 'Reserva Cancelada',
        badgeColor: '#ef4444',
        rows: [
          { label: 'Club', value: club?.name || '-' },
          { label: 'Cancha', value: court?.name || '-' },
          { label: 'Fecha', value: formatDateCO(booking.date) },
          { label: 'Horario', value: `${toAmPm(booking.startTime)} – ${toAmPm(booking.endTime)}` },
          { label: 'Reembolso', value: booking.paymentMethod === 'efectivo' ? 'No aplica (efectivo)' : 'En proceso (3-5 días)', highlight: true },
        ],
        ctaText: 'Ver otras canchas', ctaUrl: `${this.frontendUrl}/empresas`, ctaBg: '#16a34a',
        ctaNote: '¡Te esperamos pronto!',
      }),
    });
  }

  // ─── SOLICITUD DE RESEÑA ──────────────────────────────────────────────

  async sendReviewRequest(booking: Booking & { _id: any }) {
    const { court, club } = await this.getCourtAndClub(booking);
    const reviewUrl = `${this.frontendUrl}/resena?token=${booking.reviewToken}`;

    await this.send({
      to: booking.guestEmail,
      from: this.fromEmail,
      subject: `¿Cómo estuvo tu experiencia? — #${booking.bookingCode}`,
      html: buildEmailHtml({
        iconBg: '#fbbf24', iconContent: '★', iconColor: '#111827',
        title: '¡GRACIAS POR JUGAR!',
        subtitle: `Hola <strong>${booking.guestName}</strong>, esperamos que hayas disfrutado tu partido. Tu opinión nos ayuda a mejorar.`,
        badgeCode: booking.bookingCode,
        badgeLabel: 'Tu Reserva',
        badgeColor: '#fbbf24',
        rows: [
          { label: 'Club', value: club?.name || '-' },
          { label: 'Cancha', value: court?.name || '-' },
          { label: 'Deporte', value: formatSport(court?.sport) },
          { label: 'Fecha', value: formatDateCO(booking.date) },
          { label: 'Horario', value: `${toAmPm(booking.startTime)} – ${toAmPm(booking.endTime)}` },
        ],
        ctaText: 'Dejar mi reseña', ctaUrl: reviewUrl, ctaBg: '#f59e0b',
        ctaNote: 'Solo toma 30 segundos. ¡Tu opinión importa!',
      }),
    });
  }

  // ─── RECORDATORIO 24H ─────────────────────────────────────────────────

  async sendBookingReminder(booking: Booking & { _id: any }) {
    const { court, club } = await this.getCourtAndClub(booking);
    const cancelUrl = `${this.frontendUrl}/reservas/cancelar?token=${booking.cancelToken}`;

    await this.send({
      to: booking.guestEmail,
      from: this.fromEmail,
      subject: `Recordatorio: tu reserva es mañana — #${booking.bookingCode}`,
      html: buildEmailHtml({
        iconBg: '#3b82f6', iconContent: '🔔', iconColor: '#ffffff',
        title: '¡TU RESERVA ES MAÑANA!',
        subtitle: `Hola <strong>${booking.guestName}</strong>, te recordamos que tienes una reserva programada para mañana. ¡No olvides llegar a tiempo!`,
        badgeCode: booking.bookingCode,
        badgeLabel: 'Código de Reserva',
        badgeColor: '#3b82f6',
        rows: [
          { label: 'Club', value: club?.name || '-' },
          { label: 'Dirección', value: club?.address || '-' },
          { label: 'Cancha', value: court?.name || '-' },
          { label: 'Deporte', value: formatSport(court?.sport) },
          { label: 'Fecha', value: formatDateCO(booking.date) },
          { label: 'Horario', value: `${toAmPm(booking.startTime)} – ${toAmPm(booking.endTime)}` },
          { label: 'Pago', value: booking.paymentMethod === 'efectivo' ? `Efectivo: ${formatPrice(booking.totalPrice)}` : 'Pagado online', highlight: true },
        ],
        alertBox: booking.paymentMethod === 'efectivo'
          ? { bg: '#fef3c7', color: '#92400e', text: 'Recuerda llevar el pago en efectivo' }
          : undefined,
        ctaText: '¿No puedes ir? Cancelar', ctaUrl: cancelUrl, ctaBg: '#ef4444',
        ctaNote: 'Cancelación gratuita hasta 2 horas antes del turno.',
      }),
    });
  }

  // ─── NOTIFICACIÓN AL OWNER (NUEVA RESERVA) ───────────────────────────

  async sendOwnerNewBookingNotification(booking: Booking & { _id: any }, ownerEmail: string) {
    const { court, club } = await this.getCourtAndClub(booking);

    await this.send({
      to: ownerEmail,
      from: this.fromEmail,
      subject: `Nueva reserva recibida — #${booking.bookingCode}`,
      html: buildEmailHtml({
        iconBg: '#a3e635', iconContent: '📅', iconColor: '#111827',
        title: 'NUEVA RESERVA',
        subtitle: `<strong>${booking.guestName}</strong> acaba de reservar en tu cancha. Aquí tienes los detalles:`,
        badgeCode: booking.bookingCode,
        badgeColor: '#a3e635',
        rows: [
          { label: 'Cliente', value: booking.guestName },
          { label: 'Email', value: booking.guestEmail },
          { label: 'Teléfono', value: booking.guestPhone },
          { label: 'Cancha', value: court?.name || '-' },
          { label: 'Fecha', value: formatDateCO(booking.date) },
          { label: 'Horario', value: `${toAmPm(booking.startTime)} – ${toAmPm(booking.endTime)}` },
          { label: 'Método de pago', value: booking.paymentMethod === 'efectivo' ? 'Efectivo' : 'Online (Wompi)' },
          { label: 'Total', value: formatPrice(booking.totalPrice), highlight: true },
        ],
        ctaText: 'Ver en el panel', ctaUrl: `${this.frontendUrl}/dashboard/propetario/reservas`, ctaBg: '#111827',
      }),
    });
  }

  // ─── APROBACIÓN DE SOLICITUD ──────────────────────────────────────────

  async sendApprovalEmail(email: string, name: string, tempPassword: string, userData?: { id: string; nit: string; businessName: string }) {
    await this.send({
      to: email,
      from: this.fromEmail,
      subject: `¡Tu solicitud fue aprobada! — #${userData?.id || 'N/A'}`,
      html: buildEmailHtml({
        iconBg: '#a3e635', iconContent: '✓',
        title: '¡BIENVENIDO!',
        subtitle: `Tu solicitud fue aprobada, <strong>${name}</strong>. Tu cuenta está lista para usar. Aquí tienes tus credenciales de acceso:`,
        badgeCode: userData?.id || 'N/A',
        badgeLabel: 'ID de Propietario',
        badgeColor: '#a3e635',
        rows: [
          { label: 'Empresa', value: userData?.businessName || 'N/A' },
          { label: 'NIT', value: userData?.nit || 'N/A' },
          { label: 'Email', value: email },
          { label: 'Contraseña', value: `<code style="background:#f0fdf4;padding:6px 12px;border-radius:6px;font-size:16px;font-weight:600;">${tempPassword}</code>`, highlight: true },
        ],
        ctaText: 'Ingresar al panel →', ctaUrl: `${this.frontendUrl}/auth/login`, ctaBg: '#16a34a',
        ctaNote: 'Recomendamos cambiar tu contraseña al primer ingreso.',
      }),
    });
  }

  // ─── RECHAZO DE SOLICITUD ─────────────────────────────────────────────

  async sendRejectionEmail(email: string, name: string) {
    await this.send({
      to: email,
      from: this.fromEmail,
      subject: 'Actualización sobre tu solicitud — ReservaTuCancha',
      html: buildEmailHtml({
        iconBg: '#6b7280', iconContent: 'i', iconColor: '#ffffff',
        title: 'SOLICITUD NO APROBADA',
        subtitle: `Hola <strong>${name}</strong>, revisamos tu solicitud y lamentablemente no pudimos aprobarla en este momento. Si crees que fue un error, no dudes en contactarnos.`,
        rows: [
          { label: 'Estado', value: '<span style="color:#ef4444;font-weight:800;">No aprobada</span>' },
          { label: 'Siguiente paso', value: 'Contactar soporte' },
        ],
        ctaText: 'Contactar soporte', ctaUrl: `${this.frontendUrl}/soporte`, ctaBg: '#6b7280',
        ctaNote: 'Puedes volver a aplicar en cualquier momento.',
        secondaryCta: { text: 'Volver a solicitar acceso', url: `${this.frontendUrl}/solicitar-acceso` },
      }),
    });
  }

  // ─── CHANGELOG ────────────────────────────────────────────────────────

  async sendChangelogNotification(titulo: string, descripcion: string, version?: string) {
    await this.send({
      to: this.fromEmail,
      from: this.fromEmail,
      subject: `Nueva actualización: ${titulo}`,
      html: buildEmailHtml({
        iconBg: '#8b5cf6', iconContent: '🚀', iconColor: '#ffffff',
        title: titulo,
        subtitle: descripcion,
        badgeCode: version || 'latest',
        badgeLabel: 'Versión',
        badgeColor: '#8b5cf6',
        rows: [],
      }),
    });
  }

  // ─── NOTIFICACIÓN ADMIN ───────────────────────────────────────────────

  async sendAdminNotification({ subject, html }: { subject: string; html: string }) {
    await this.send({ to: this.fromEmail, from: this.fromEmail, subject, html });
  }

  // ─── NUEVA SOLICITUD AL ADMIN ─────────────────────────────────────────

  async sendNewSolicitudNotification(data: {
    firstName: string; lastName: string; email: string; phone: string;
    businessName: string; nit: string; city: string; department: string; message?: string;
  }) {
    const receivedAt = new Date().toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota',
    });

    const rows: { label: string; value: string; highlight?: boolean }[] = [
      { label: 'Nombre', value: `${data.firstName} ${data.lastName}` },
      { label: 'Email', value: data.email },
      { label: 'Teléfono', value: data.phone },
      { label: 'NIT / Cédula', value: data.nit },
      { label: 'Ciudad', value: `${data.city}, ${data.department}` },
    ];
    if (data.message) {
      rows.push({ label: 'Mensaje', value: data.message });
    }
    rows.push({ label: 'Recibido', value: receivedAt });

    await this.send({
      to: this.adminEmail,
      from: this.fromEmail,
      subject: `Nueva solicitud de acceso — ${data.businessName}`,
      html: buildEmailHtml({
        iconBg: '#a3e635', iconContent: '!', iconColor: '#111827',
        title: 'NUEVA SOLICITUD',
        subtitle: 'Alguien acaba de solicitar acceso a la plataforma. Revisa los datos y aprueba o rechaza desde el panel.',
        badgeCode: data.businessName,
        badgeLabel: 'Negocio',
        badgeColor: '#a3e635',
        rows,
        ctaText: 'Ver en el panel admin', ctaUrl: `${this.frontendUrl}/dashboard/admin/solicitudes`, ctaBg: '#111827',
      }),
    });
  }
}
