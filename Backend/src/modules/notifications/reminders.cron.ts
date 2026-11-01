import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument, BookingStatus } from '../bookings/schemas/booking.schema';
import { NotificationsService, formatDateCO, toAmPm } from './notifications.service';
import { PushService } from './push.service';
import { WhatsappService } from './whatsapp.service';

/**
 * Instante en que empieza un turno. La fecha se guarda como la medianoche
 * local del día (ver BookingsService.create), así que se le suma la hora.
 */
export function inicioDelTurno(fecha: Date, hhmm: string): number {
  const [h, m] = String(hhmm ?? '0:0').split(':').map(Number);
  const inicio = new Date(fecha);
  inicio.setHours(h || 0, m || 0, 0, 0);
  return inicio.getTime();
}

@Injectable()
export class RemindersCron {
  private readonly logger = new Logger(RemindersCron.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly push: PushService,
    private readonly whatsapp: WhatsappService,
  ) {}

  /**
   * Cada hora busca los turnos que empiezan en las próximas 24 horas y le
   * recuerda al jugador por correo, push (si reservó desde la app) y WhatsApp.
   *
   * Antes se comparaba solo la fecha (medianoche) contra una ventana de 23 a
   * 24 horas, así que el recordatorio salía a la medianoche del día anterior
   * sin importar la hora del turno. Ahora cuenta la hora de inicio.
   *
   * No se le recuerda a quien reservó hace menos de 2 horas: acaba de recibir
   * la confirmación.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async sendReminders() {
    const ahora = Date.now();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const pasadoManana = new Date(hoy.getTime() + 2 * 24 * 3600 * 1000);

    const candidatas = await this.bookingModel.find({
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.REAGENDADA] },
      reminderSent: { $ne: true },
      date: { $gte: hoy, $lte: pasadoManana },
    })
      // el recordatorio lleva el enlace para mover el turno
      .select('+cancelToken +pushToken')
      .populate('courtId', 'name')
      .lean();

    const bookings = candidatas.filter((b: any) => {
      const horas = (inicioDelTurno(b.date, b.startTime) - ahora) / 3_600_000;
      const recienCreada = b.createdAt && ahora - new Date(b.createdAt).getTime() < 2 * 3_600_000;
      return horas > 0 && horas <= 24 && !recienCreada;
    });

    if (bookings.length === 0) return;

    this.logger.log(`Enviando ${bookings.length} recordatorios...`);

    for (const booking of bookings as any[]) {
      const inicio = new Date(inicioDelTurno(booking.date, booking.startTime));
      const cuando = inicio.toDateString() === new Date(ahora).toDateString() ? 'hoy' : 'mañana';
      const cancha = booking.courtId?.name ?? 'la cancha';
      const horario = `${toAmPm(booking.startTime)} – ${toAmPm(booking.endTime)}`;

      /* Cada canal por su lado: si WhatsApp falla, el correo igual sale. */
      try {
        await this.notificationsService.sendBookingReminder(booking, cuando);
      } catch (e) {
        this.logger.error(`Error recordatorio por correo ${booking.bookingCode}: ${e.message}`);
      }
      await this.push.enviar([booking.pushToken], {
        titulo: `Tu turno es ${cuando} a las ${toAmPm(booking.startTime)}`,
        cuerpo: `${cancha} · código ${booking.bookingCode}`,
        datos: { tipo: 'recordatorio', bookingCode: booking.bookingCode },
      });
      await this.whatsapp.recordatorio(booking.guestPhone, {
        nombre: String(booking.guestName ?? '').split(' ')[0] || 'jugador',
        cancha,
        fecha: `${cuando}, ${formatDateCO(booking.date)}`,
        horario,
        codigo: booking.bookingCode,
      });

      await this.bookingModel.updateOne({ _id: booking._id }, { $set: { reminderSent: true } });
      this.logger.log(`Recordatorio enviado: ${booking.bookingCode}`);
    }
  }

  /**
   * Cada 10 minutos borra las reservas pendientes creadas hace más de 30 min.
   * Pago abandonado: el cliente inició la reserva pero nunca completó el pago,
   * y mientras tanto el horario le queda bloqueado al club.
   *
   * No se filtra por pasarela a propósito: solo se cobra en línea, así que una
   * reserva en pending es siempre un pago que no llegó. Filtrar por el nombre
   * de la pasarela dejaba vivas para siempre las reservas de la pasarela nueva.
   */
  @Cron('*/10 * * * *')
  async expirarReservasAbandonadas() {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000);

    const result = await this.bookingModel.deleteMany({
        status: BookingStatus.PENDING,
        createdAt: { $lt: cutoff },
      } as any);

    if (result.deletedCount > 0) {
      this.logger.log(`Expiradas ${result.deletedCount} reservas abandonadas (>30min sin pago)`);
    }
  }
}
