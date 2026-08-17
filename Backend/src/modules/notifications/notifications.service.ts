// src/modules/notifications/notifications.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resend } from 'resend';
import { Booking } from '../bookings/schemas/booking.schema';
import { CourtsService } from '../courts/courts.service';
import { ClubsService } from '../clubs/clubs.service';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';

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

// ─── Template base (solo para emails NUEVOS) ────────────────────────────────

interface EmailTemplateOptions {
  iconBg: string; iconContent: string; iconColor?: string;
  title: string; subtitle: string;
  badgeCode?: string; badgeLabel?: string; badgeColor?: string;
  rows: { label: string; value: string; highlight?: boolean }[];
  ctaText?: string; ctaUrl?: string; ctaBg?: string; ctaNote?: string;
  alertBox?: { bg: string; color: string; text: string };
  secondaryCta?: { text: string; url: string };
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
        Enviado por <strong>ReservaTuCancha</strong>
      </div>
    </div>
  `;
}

// ─── Plantilla de novedades / changelog ─────────────────────────────────────

const LOGO_URL = 'https://res.cloudinary.com/doio3695p/image/upload/e_trim/f_auto,q_auto,w_128/v1786851027/ReservaTuCanchaLOGO_nqvonv.png';

/** El título y la descripción los escribe el admin: se escapan antes de
 *  interpolarlos para que un `<` no rompa el correo. */
function escapeHtml(text: string): string {
  return (text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface ChangelogBlock { heading?: string; body: string }

/**
 * Parte el texto plano del changelog en bloques. Un renglón corto en MAYÚSCULAS
 * al inicio de un párrafo se toma como título de sección, así el correo respeta
 * la estructura que se escribió en el panel (en HTML los saltos de línea se
 * colapsan y todo quedaría en un solo bloque de texto).
 */
function parseChangelogBlocks(descripcion: string): ChangelogBlock[] {
  return (descripcion ?? '')
    .split(/\n{2,}/)
    .map(b => b.trim())
    .filter(Boolean)
    .map(block => {
      const [first, ...rest] = block.split('\n');
      const isHeading = rest.length > 0 && first.length <= 40 && first === first.toUpperCase();
      return isHeading
        ? { heading: first, body: rest.join('\n') }
        : { body: block };
    });
}

const brText = (text: string) => escapeHtml(text).replace(/\n/g, '<br>');

/**
 * Hoja de estilos del correo. Va en un <style> del <head> por las media
 * queries: en escritorio las secciones van en dos columnas y en móvil se
 * apilan. Sin esto el correo era una columna de 620px y en PC se veía como una
 * app móvil rodeada de vacío. Outlook de escritorio las ignora, pero se queda
 * con el diseño de escritorio, que es el correcto ahí.
 *
 * El correo se declara SOLO CLARO a propósito, igual que los de Mesoft. Gmail
 * en móvil no soporta `prefers-color-scheme`: aplica su propio remapeo de
 * colores. Declarar `light dark` le da permiso para hacerlo y las reglas de
 * modo oscuro nunca se aplican, así que el resultado era un correo a medio
 * invertir. Con `light` el cliente deja los colores como están y se ve igual en
 * bandeja clara u oscura.
 */
const CHANGELOG_STYLES = `
  :root { color-scheme: light; supported-color-schemes: light; }

  body, table, td, p, a, h1 { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }

  @media only screen and (max-width: 640px) {
    .container   { width: 100% !important; }
    .col         { display: block !important; width: 100% !important; padding: 0 0 10px 0 !important; }
    .frame       { padding: 10px !important; }
    .hero        { padding: 34px 22px !important; }
    .hero-title  { font-size: 24px !important; line-height: 31px !important; }
    .card        { padding: 22px 20px !important; }
  }
`;

/**
 * Correo de novedades. Estructura "boxed": un marco exterior con tarjetas
 * redondeadas dentro — encabezado oscuro, las secciones de la novedad en dos
 * columnas y una tarjeta final con el logo y el botón.
 */
function buildChangelogHtml(opts: {
  titulo: string; descripcion: string; version?: string; novedadesUrl: string;
}): string {
  const blocks = parseChangelogBlocks(opts.descripcion);

  /* La primera línea suelta (sin título en mayúsculas) hace de entradilla
     dentro del encabezado oscuro; el resto son tarjetas. */
  const intro = blocks.length && !blocks[0].heading ? blocks[0] : null;
  const sections = intro ? blocks.slice(1) : blocks;

  const versionBadge = opts.version ? `
    <div style="margin-top: 22px;">
      <span style="display: inline-block; background-color: rgba(163,230,53,.14); border: 1px solid rgba(163,230,53,.32); border-radius: 999px; padding: 7px 15px; color: #a3e635; font-size: 12px; font-weight: 800; letter-spacing: 1px;">
        VERSIÓN ${escapeHtml(opts.version)}
      </span>
    </div>
  ` : '';

  const cardHtml = (s: ChangelogBlock) => `
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate;">
      <tr>
        <td class="card" style="background-color: #f7f8fa; border-radius: 16px; padding: 26px 24px;">
          ${s.heading ? `
            <p style="margin: 0 0 10px; color: #16a34a; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.4px;">
              ${escapeHtml(s.heading)}
            </p>` : ''}
          <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 25px;">${brText(s.body)}</p>
        </td>
      </tr>
    </table>
  `;

  /* Dos tarjetas por fila en escritorio; la clase .col las apila en móvil.
     Si sobra una, ocupa el ancho completo. */
  const sectionRows: string[] = [];
  for (let i = 0; i < sections.length; i += 2) {
    const left = sections[i];
    const right = sections[i + 1];
    sectionRows.push(`
      <tr>
        <td style="padding-bottom: 10px;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td class="col" width="${right ? '50%' : '100%'}" valign="top" style="padding-right: ${right ? '5px' : '0'};">
                ${cardHtml(left)}
              </td>
              ${right ? `
              <td class="col" width="50%" valign="top" style="padding-left: 5px;">
                ${cardHtml(right)}
              </td>` : ''}
            </tr>
          </table>
        </td>
      </tr>
    `);
  }

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(opts.titulo)}</title>
  <style>${CHANGELOG_STYLES}</style>
</head>
<body style="margin: 0; padding: 0; background-color: #eceef2;">
  <div style="background-color: #eceef2; padding: 28px 12px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <table class="container" align="center" border="0" cellpadding="0" cellspacing="0" width="820" style="width: 820px; max-width: 100%; border-collapse: separate; margin: 0 auto;">
      <tr>
        <td class="frame" style="background-color: #ffffff; border-radius: 22px; padding: 14px;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate;">

            <!-- Barra superior: logo + marca -->
            <tr>
              <td style="padding: 10px 12px 16px;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="left" valign="middle" width="40">
                      <img src="${LOGO_URL}" alt="ReservaTuCancha" width="32" style="display: block;">
                    </td>
                    <td align="right" valign="middle" style="color: #9ca3af; font-size: 13px; font-weight: 600;">
                      ReservaTuCancha
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Encabezado -->
            <tr>
              <td class="hero" style="background-color: #111827; border-radius: 16px; padding: 50px 34px; text-align: center;">
                <p style="margin: 0 0 14px; color: #a3e635; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">
                  &#10022; Novedades
                </p>
                <h1 class="hero-title" style="margin: 0 auto; max-width: 520px; color: #ffffff; font-size: 30px; font-weight: 800; line-height: 38px; letter-spacing: -0.5px;">
                  ${escapeHtml(opts.titulo)}
                </h1>
                ${intro ? `
                  <p style="margin: 16px auto 0; max-width: 440px; color: #9ca3af; font-size: 15px; line-height: 23px;">
                    ${brText(intro.body)}
                  </p>` : ''}
                ${versionBadge}
              </td>
            </tr>

            <tr><td style="height: 10px; line-height: 10px; font-size: 0;">&nbsp;</td></tr>

            <!-- Secciones de la novedad -->
            ${sectionRows.join('')}

            <!-- Cierre -->
            <tr>
              <td class="card" style="background-color: #f7f8fa; border-radius: 16px; padding: 36px 24px; text-align: center;">
                <div style="background-color: #111827; border-radius: 14px; width: 56px; height: 56px; margin: 0 auto 18px; display: table;">
                  <span style="display: table-cell; vertical-align: middle; text-align: center;">
                    <img src="${LOGO_URL}" alt="" width="30" style="display: inline-block;">
                  </span>
                </div>
                <p style="margin: 0 auto 20px; max-width: 400px; color: #111827; font-size: 19px; font-weight: 800; line-height: 26px;">
                  Todo esto ya está activo en tu panel
                </p>
                <a href="${opts.novedadesUrl}" style="background-color: #16a34a; color: #ffffff; padding: 15px 32px; border-radius: 14px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">
                  Ver todas las novedades
                </a>
              </td>
            </tr>

            <!-- Pie -->
            <tr>
              <td style="padding: 30px 20px 16px; text-align: center;">
                <p style="margin: 0 auto 16px; max-width: 320px; color: #9ca3af; font-size: 12px; line-height: 19px;">
                  La forma más fácil de reservar canchas deportivas en Colombia.
                </p>
                <p style="margin: 0 0 16px;">
                  <a href="https://www.instagram.com/reservatucancha.site/" style="color: #6b7280; font-size: 12px; text-decoration: none; padding: 0 9px;">Instagram</a>
                  <span style="color: #d1d5db;">&middot;</span>
                  <a href="https://wa.me/573124352786" style="color: #6b7280; font-size: 12px; text-decoration: none; padding: 0 9px;">WhatsApp</a>
                  <span style="color: #d1d5db;">&middot;</span>
                  <a href="${opts.novedadesUrl}" style="color: #6b7280; font-size: 12px; text-decoration: none; padding: 0 9px;">Novedades</a>
                </p>
                <p style="margin: 0; color: #b9bfc9; font-size: 11px; line-height: 17px;">
                  Recibes este correo porque tienes un club registrado en ReservaTuCancha.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
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
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
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

  // ═══════════════════════════════════════════════════════════════════════
  // EMAILS ORIGINALES (restaurados tal cual)
  // ═══════════════════════════════════════════════════════════════════════

  async sendBookingConfirmation(booking: Booking & { _id: any }) {
    const { court, club } = await this.getCourtAndClub(booking);
    const cancelUrl  = `${this.frontendUrl}/reservas/cancelar?token=${booking.cancelToken}`;
    const bookingDate = formatDateCO(booking.date);
    const startAmPm = toAmPm(booking.startTime);
    const endAmPm = toAmPm(booking.endTime);
    const sportLabel = formatSport(court?.sport);
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
                    <td style="color: #6b7280; font-size: 14px;">Club</td>
                    <td align="right" style="color: #111827; font-size: 14px; font-weight: 700;">${club?.name || '-'}</td>
                  </tr>
                  <tr style="height: 45px;">
                    <td style="color: #6b7280; font-size: 14px;">Dirección</td>
                    <td align="right" style="color: #111827; font-size: 14px; font-weight: 700;">${club?.address || '-'}</td>
                  </tr>
                  <tr style="height: 45px;">
                    <td style="color: #6b7280; font-size: 14px;">Deporte</td>
                    <td align="right" style="color: #111827; font-size: 14px; font-weight: 700;">${sportLabel}</td>
                  </tr>
                  <tr style="height: 45px;">
                    <td style="color: #6b7280; font-size: 14px;">Fecha</td>
                    <td align="right" style="color: #111827; font-size: 14px; font-weight: 700;">${bookingDate}</td>
                  </tr>
                  <tr style="height: 45px;">
                    <td style="color: #6b7280; font-size: 14px;">Horario</td>
                    <td align="right" style="color: #111827; font-size: 14px; font-weight: 700;">${startAmPm} – ${endAmPm}</td>
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

  async sendBookingPendingCash(booking: Booking & { _id: any }) {
    const { court, club } = await this.getCourtAndClub(booking);
    const cancelUrl = `${this.frontendUrl}/reservas/cancelar?token=${booking.cancelToken}`;
    const bookingDate = formatDateCO(booking.date);
    await this.send({
      to: booking.guestEmail,
      from: this.fromEmail,
      subject: `Reserva pendiente de pago — #${booking.bookingCode}`,
      html: `
        <div style="background-color: #f3f4f6; padding: 40px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 450px; background-color: #111827; border-radius: 32px; overflow: hidden; border-collapse: separate;">
            <tr>
              <td align="center" style="padding: 40px 30px;">
                <div style="background-color: #f59e0b; width: 64px; height: 64px; border-radius: 50%; margin-bottom: 24px; display: table;">
                  <span style="display: table-cell; vertical-align: middle; font-size: 26px; font-weight: 900; color: #111827; font-family: Georgia, serif;">$</span>
                </div>
                <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: -0.5px;">Reserva Creada</h1>
                <p style="color: #9ca3af; font-size: 14px; margin-top: 10px; line-height: 20px;">
                  Hola <strong>${booking.guestName}</strong>, tu reserva fue registrada exitosamente. Recuerda llevar el valor en efectivo el día de tu visita.
                </p>
                <div style="background-color: #1f2937; border-radius: 20px; padding: 24px; margin-top: 28px; border: 1px solid #374151;">
                  <span style="color: #9ca3af; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Código de Reserva</span>
                  <span style="color: #f59e0b; font-size: 34px; font-weight: 800; letter-spacing: 4px; display: block;">#${booking.bookingCode}</span>
                  <span style="color: #6b7280; font-size: 12px; display: block; margin-top: 10px; line-height: 18px;">Presenta este código cuando llegues al lugar para confirmar tu reserva.</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background-color: #ffffff; padding: 40px 30px; border-radius: 32px 32px 0 0;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                  <tr style="height: 45px;">
                    <td style="color: #6b7280; font-size: 14px;">Club</td>
                    <td align="right" style="color: #111827; font-size: 14px; font-weight: 700;">${club?.name || '-'}</td>
                  </tr>
                  <tr style="height: 45px;">
                    <td style="color: #6b7280; font-size: 14px;">Dirección</td>
                    <td align="right" style="color: #111827; font-size: 14px; font-weight: 700;">${club?.address || '-'}</td>
                  </tr>
                  <tr style="height: 45px;">
                    <td style="color: #6b7280; font-size: 14px;">Fecha</td>
                    <td align="right" style="color: #111827; font-size: 14px; font-weight: 700;">${bookingDate}</td>
                  </tr>
                  <tr style="height: 45px;">
                    <td style="color: #6b7280; font-size: 14px;">Horario</td>
                    <td align="right" style="color: #111827; font-size: 14px; font-weight: 700;">${toAmPm(booking.startTime)} – ${toAmPm(booking.endTime)}</td>
                  </tr>
                  <tr style="height: 65px;">
                    <td style="color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Total a pagar</td>
                    <td align="right" style="color: #d97706; font-size: 18px; font-weight: 800; border-top: 1px solid #f3f4f6;">$${booking.totalPrice?.toLocaleString('es-CO')} COP</td>
                  </tr>
                </table>
                <div style="margin-top: 20px; background-color: #fef3c7; border-radius: 12px; padding: 16px; text-align: center;">
                  <p style="color: #92400e; font-size: 13px; margin: 0; font-weight: 600;">Pago en efectivo al llegar al lugar</p>
                </div>
                <div style="margin-top: 24px; text-align: center;">
                  <a href="${cancelUrl}" style="background-color: #ef4444; color: #ffffff; padding: 16px 32px; border-radius: 16px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">
                    Cancelar reserva
                  </a>
                  <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">Cancelación gratuita hasta 2 horas antes del turno.</p>
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

  async sendCashPaymentConfirmed(booking: Booking & { _id: any }) {
    const { court, club } = await this.getCourtAndClub(booking);
    const bookingDate = formatDateCO(booking.date);
    const startAmPm = toAmPm(booking.startTime);
    const endAmPm = toAmPm(booking.endTime);
    const sportLabel = formatSport(court?.sport);
    const courtName = (booking.courtId as any)?.name || court?.name || 'tu cancha';
    await this.send({
      to: booking.guestEmail,
      from: this.fromEmail,
      subject: `¡Pago recibido! — #${booking.bookingCode}`,
      html: `
        <div style="background-color: #f3f4f6; padding: 40px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 450px; background-color: #111827; border-radius: 32px; overflow: hidden; border-collapse: separate;">
            <tr>
              <td align="center" style="padding: 40px 30px;">
                <div style="background-color: #22c55e; width: 64px; height: 64px; border-radius: 50%; margin-bottom: 24px; display: table;">
                  <span style="display: table-cell; vertical-align: middle; font-size: 30px; color: #ffffff;">✓</span>
                </div>
                <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: -0.5px;">¡PAGO CONFIRMADO!</h1>
                <p style="color: #9ca3af; font-size: 14px; margin-top: 10px; line-height: 20px;">
                  Gracias por tu pago <strong>${booking.guestName}</strong>, fue recibido exitosamente. ¡Disfruta de ${courtName}! Este correo es tu comprobante de pago.
                </p>
                <div style="background-color: #1f2937; border-radius: 20px; padding: 20px; margin-top: 28px; border: 1px solid #374151;">
                  <span style="color: #9ca3af; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Código de Reserva</span>
                  <span style="color: #22c55e; font-size: 30px; font-weight: 800; letter-spacing: 2px;">#${booking.bookingCode}</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background-color: #ffffff; padding: 40px 30px; border-radius: 32px 32px 0 0;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                  <tr style="height: 45px;">
                    <td style="color: #6b7280; font-size: 14px;">Cancha</td>
                    <td align="right" style="color: #111827; font-size: 14px; font-weight: 700;">${courtName}</td>
                  </tr>
                  <tr style="height: 45px;">
                    <td style="color: #6b7280; font-size: 14px;">Club</td>
                    <td align="right" style="color: #111827; font-size: 14px; font-weight: 700;">${club?.name || '-'}</td>
                  </tr>
                  <tr style="height: 45px;">
                    <td style="color: #6b7280; font-size: 14px;">Deporte</td>
                    <td align="right" style="color: #111827; font-size: 14px; font-weight: 700;">${sportLabel}</td>
                  </tr>
                  <tr style="height: 45px;">
                    <td style="color: #6b7280; font-size: 14px;">Fecha</td>
                    <td align="right" style="color: #111827; font-size: 14px; font-weight: 700;">${bookingDate}</td>
                  </tr>
                  <tr style="height: 45px;">
                    <td style="color: #6b7280; font-size: 14px;">Horario</td>
                    <td align="right" style="color: #111827; font-size: 14px; font-weight: 700;">${startAmPm} – ${endAmPm}</td>
                  </tr>
                  <tr style="height: 45px;">
                    <td style="color: #6b7280; font-size: 14px;">Método de pago</td>
                    <td align="right" style="color: #111827; font-size: 14px; font-weight: 700;">Efectivo</td>
                  </tr>
                  <tr style="height: 65px;">
                    <td style="color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Total pagado</td>
                    <td align="right" style="color: #22c55e; font-size: 18px; font-weight: 800; border-top: 1px solid #f3f4f6;">$${booking.totalPrice?.toLocaleString('es-CO')} COP</td>
                  </tr>
                </table>
                <div style="margin-top: 20px; background-color: #f0fdf4; border-radius: 12px; padding: 16px; text-align: center;">
                  <p style="color: #166534; font-size: 13px; margin: 0; font-weight: 600;">Comprobante de pago — ${courtName}</p>
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

  async sendApprovalEmail(email: string, name: string, tempPassword: string, userData?: { id: string; nit: string; businessName: string }) {
    await this.send({
      to: email,
      from: this.fromEmail,
      subject: `¡Tu solicitud fue aprobada! — #${userData?.id || 'N/A'}`,
      html: `
        <div style="background-color: #f3f4f6; padding: 40px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 450px; background-color: #111827; border-radius: 32px; overflow: hidden; border-collapse: separate;">
            <tr>
              <td align="center" style="padding: 40px 30px;">
                <div style="background-color: #a3e635; width: 64px; height: 64px; border-radius: 50%; margin-bottom: 24px; display: table;">
                  <span style="display: table-cell; vertical-align: middle; font-size: 30px; color: #111827;">✓</span>
                </div>
                <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: -0.5px;">¡BIENVENIDO!</h1>
                <p style="color: #9ca3af; font-size: 14px; margin-top: 10px; line-height: 20px;">
                  Tu solicitud fue aprobada, <strong>${name}</strong>. Tu cuenta está lista para usar. Aquí tienes tus credenciales de acceso:
                </p>
                <div style="background-color: #1f2937; border-radius: 20px; padding: 20px; margin-top: 28px; border: 1px solid #374151;">
                  <span style="color: #9ca3af; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">ID de Propietario</span>
                  <span style="color: #a3e635; font-size: 30px; font-weight: 800; letter-spacing: 2px;">#${userData?.id || 'N/A'}</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background-color: #ffffff; padding: 40px 30px; border-radius: 32px 32px 0 0;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                  <tr style="height: 45px;">
                    <td style="color: #6b7280; font-size: 14px;">Empresa</td>
                    <td align="right" style="color: #111827; font-size: 14px; font-weight: 700;">${userData?.businessName || 'N/A'}</td>
                  </tr>
                  <tr style="height: 45px;">
                    <td style="color: #6b7280; font-size: 14px;">NIT</td>
                    <td align="right" style="color: #111827; font-size: 14px; font-weight: 700;">${userData?.nit || 'N/A'}</td>
                  </tr>
                  <tr style="height: 45px;">
                    <td style="color: #6b7280; font-size: 14px;">Email</td>
                    <td align="right" style="color: #111827; font-size: 14px; font-weight: 700;">${email}</td>
                  </tr>
                  <tr style="height: 65px;">
                    <td style="color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Contraseña</td>
                    <td align="right" style="color: #111827; font-size: 14px; font-weight: 700; border-top: 1px solid #f3f4f6;"><code style="background:#f0fdf4;padding:6px 12px;border-radius:6px;font-size:16px;font-weight:600;">${tempPassword}</code></td>
                  </tr>
                </table>
                <div style="margin-top: 32px; text-align: center;">
                  <a href="${this.frontendUrl}/auth/login" style="background-color: #16a34a; color: #ffffff; padding: 16px 32px; border-radius: 16px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                    Ingresar al panel →
                  </a>
                  <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
                    Recomendamos cambiar tu contraseña al primer ingreso.
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

  async sendRejectionEmail(email: string, name: string) {
    await this.send({
      to: email,
      from: this.fromEmail,
      subject: 'Actualización sobre tu solicitud — ReservaTuCancha',
      html: `<p>Hola ${name}, revisamos tu solicitud y no pudimos aprobarla en este momento.</p>`,
    });
  }

  async sendCancellationConfirmation(booking: Booking & { _id: any }) {
    await this.send({
      to: booking.guestEmail,
      from: this.fromEmail,
      subject: 'Reserva cancelada — ReservaTuCancha',
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
    const { court, club } = await this.getCourtAndClub(booking);
    const courtName = (booking.courtId as any)?.name || court?.name || 'tu cancha';
    const clubName = club?.name || 'el club';
    const bookingDate = formatDateCO(booking.date);
    const reviewUrl = `${this.frontendUrl}/resena?token=${booking.reviewToken}`;
    await this.send({
      to: booking.guestEmail,
      from: this.fromEmail,
      subject: '¿Cómo estuvo tu experiencia? — ReservaTuCancha',
      html: `
        <div style="background-color: #f3f4f6; padding: 40px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 450px; background-color: #111827; border-radius: 32px; overflow: hidden; border-collapse: separate;">
            <tr>
              <td align="center" style="padding: 40px 30px;">
                <div style="background-color: #a3e635; width: 64px; height: 64px; border-radius: 50%; margin-bottom: 24px; display: table;">
                  <span style="display: table-cell; vertical-align: middle; font-size: 30px; color: #111827;">★</span>
                </div>
                <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: -0.5px;">¿Cómo estuvo la cancha?</h1>
                <p style="color: #9ca3af; font-size: 14px; margin-top: 12px; line-height: 22px;">
                  Hola <strong style="color: #ffffff;">${booking.guestName}</strong>, gracias por jugar en <strong style="color: #a3e635;">${courtName}</strong>. Tu opinión nos ayuda a mejorar y ayuda a otros jugadores a elegir.
                </p>
                <div style="background-color: #1f2937; border-radius: 20px; padding: 20px; margin-top: 28px; border: 1px solid #374151;">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0">
                    <tr style="height: 35px;">
                      <td style="color: #9ca3af; font-size: 13px;">Cancha</td>
                      <td align="right" style="color: #ffffff; font-size: 13px; font-weight: 700;">${courtName}</td>
                    </tr>
                    <tr style="height: 35px;">
                      <td style="color: #9ca3af; font-size: 13px;">Club</td>
                      <td align="right" style="color: #ffffff; font-size: 13px; font-weight: 700;">${clubName}</td>
                    </tr>
                    <tr style="height: 35px;">
                      <td style="color: #9ca3af; font-size: 13px;">Fecha</td>
                      <td align="right" style="color: #ffffff; font-size: 13px; font-weight: 700;">${bookingDate}</td>
                    </tr>
                  </table>
                </div>
                <div style="margin-top: 32px;">
                  <a href="${reviewUrl}" style="display: inline-block; background-color: #a3e635; color: #111827; padding: 16px 40px; border-radius: 16px; text-decoration: none; font-weight: 800; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">
                    ⭐ Dejar mi reseña
                  </a>
                </div>
                <p style="color: #6b7280; font-size: 11px; margin-top: 16px;">Solo toma 30 segundos</p>
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

  /**
   * Envía la novedad a los propietarios registrados. Usa el endpoint batch de
   * Resend: una sola llamada por lote, pero un correo independiente para cada
   * uno, así nadie ve la dirección de los demás.
   *
   * @param destinatarios 'todos' o el plan al que se limita ('pro', etc.)
   * @returns cuántos correos se encolaron, para poder reportarlo en el panel
   */
  async sendChangelogNotification(
    titulo: string,
    descripcion: string,
    version?: string,
    destinatarios: string = 'todos',
  ): Promise<{ enviados: number; destinatarios: number }> {
    const filtro: Record<string, any> = { role: UserRole.OWNER, isActive: true };
    if (destinatarios && destinatarios !== 'todos') filtro.plan = destinatarios;

    const owners = await this.userModel.find(filtro).select('email').lean();
    const emails = owners.map(o => o.email).filter(Boolean);

    if (emails.length === 0) {
      this.logger.warn(`Changelog "${titulo}": no hay propietarios que coincidan con "${destinatarios}"`);
      return { enviados: 0, destinatarios: 0 };
    }

    const html = buildChangelogHtml({
      titulo,
      descripcion,
      version,
      novedadesUrl: `${this.frontendUrl}/novedades`,
    });
    const subject = `Novedades de ReservaTuCancha: ${titulo}`;

    /* Resend acepta hasta 100 mensajes por llamada al batch */
    const LOTE = 100;
    let enviados = 0;

    for (let i = 0; i < emails.length; i += LOTE) {
      const lote = emails.slice(i, i + LOTE);
      try {
        const { error } = await this.resend.batch.send(
          lote.map(to => ({ to, from: this.fromEmail, subject, html })),
        );
        if (error) {
          this.logger.error(`Error enviando lote de changelog: ${error.name} - ${error.message}`);
          continue;
        }
        enviados += lote.length;
      } catch (error) {
        this.logger.error(`Error crítico enviando lote de changelog: ${error.message}`);
      }
    }

    this.logger.log(`Changelog "${titulo}": ${enviados}/${emails.length} correos enviados (${destinatarios})`);
    return { enviados, destinatarios: emails.length };
  }

  async sendAdminNotification({ subject, html }: { subject: string; html: string }) {
    await this.send({ to: this.fromEmail, from: this.fromEmail, subject, html });
  }

  async sendNewSolicitudNotification(data: {
    firstName: string; lastName: string; email: string; phone: string;
    businessName: string; nit: string; city: string; department: string; message?: string;
  }) {
    const receivedAt = new Date().toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota',
    });

    await this.send({
      to: this.adminEmail,
      from: this.fromEmail,
      subject: `Nueva solicitud de acceso — ${data.businessName}`,
      html: `
        <div style="background-color: #f3f4f6; padding: 40px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 450px; background-color: #111827; border-radius: 32px; overflow: hidden; border-collapse: separate;">
            <tr>
              <td align="center" style="padding: 40px 30px;">
                <div style="background-color: #a3e635; width: 64px; height: 64px; border-radius: 50%; margin-bottom: 24px; display: table;">
                  <span style="display: table-cell; vertical-align: middle; font-size: 28px; color: #111827; font-weight: 900;">!</span>
                </div>
                <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: -0.5px;">Nueva Solicitud</h1>
                <p style="color: #9ca3af; font-size: 14px; margin-top: 10px; line-height: 20px;">
                  Alguien acaba de solicitar acceso a la plataforma. Revisa los datos y aprueba o rechaza desde el panel de administración.
                </p>
                <div style="background-color: #1f2937; border-radius: 20px; padding: 20px; margin-top: 28px; border: 1px solid #374151;">
                  <span style="color: #9ca3af; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Negocio</span>
                  <span style="color: #a3e635; font-size: 22px; font-weight: 800; letter-spacing: 1px;">${data.businessName}</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background-color: #ffffff; padding: 40px 30px; border-radius: 32px 32px 0 0;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                  <tr style="height: 45px;">
                    <td style="color: #6b7280; font-size: 14px;">Nombre</td>
                    <td align="right" style="color: #111827; font-size: 14px; font-weight: 700;">${data.firstName} ${data.lastName}</td>
                  </tr>
                  <tr style="height: 45px;">
                    <td style="color: #6b7280; font-size: 14px;">Email</td>
                    <td align="right" style="color: #111827; font-size: 14px; font-weight: 700;">${data.email}</td>
                  </tr>
                  <tr style="height: 45px;">
                    <td style="color: #6b7280; font-size: 14px;">Teléfono</td>
                    <td align="right" style="color: #111827; font-size: 14px; font-weight: 700;">${data.phone}</td>
                  </tr>
                  <tr style="height: 45px;">
                    <td style="color: #6b7280; font-size: 14px;">NIT / Cédula</td>
                    <td align="right" style="color: #111827; font-size: 14px; font-weight: 700;">${data.nit}</td>
                  </tr>
                  <tr style="height: 45px;">
                    <td style="color: #6b7280; font-size: 14px;">Ciudad</td>
                    <td align="right" style="color: #111827; font-size: 14px; font-weight: 700;">${data.city}, ${data.department}</td>
                  </tr>
                  ${data.message ? `
                  <tr>
                    <td colspan="2" style="padding-top: 16px; border-top: 1px solid #f3f4f6;">
                      <span style="color: #6b7280; font-size: 13px; font-weight: 600; display: block; margin-bottom: 6px;">Mensaje adicional</span>
                      <span style="color: #374151; font-size: 13px; line-height: 20px;">${data.message}</span>
                    </td>
                  </tr>
                  ` : ''}
                  <tr style="height: 50px;">
                    <td style="color: #6b7280; font-size: 12px; border-top: 1px solid #f3f4f6;">Recibido</td>
                    <td align="right" style="color: #9ca3af; font-size: 12px; border-top: 1px solid #f3f4f6;">${receivedAt}</td>
                  </tr>
                </table>
                <div style="margin-top: 32px; text-align: center;">
                  <a href="${this.frontendUrl}/dashboard/admin/solicitudes" style="background-color: #111827; color: #ffffff; padding: 16px 32px; border-radius: 16px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                    Ver en el panel admin
                  </a>
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

  // ═══════════════════════════════════════════════════════════════════════
  // EMAILS NUEVOS (recordatorio 24h + notificación al owner)
  // ═══════════════════════════════════════════════════════════════════════

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
}
