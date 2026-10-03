import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument, BookingStatus } from '../bookings/schemas/booking.schema';
import { NotificationsService } from './notifications.service';

@Injectable()
export class RemindersCron {
  private readonly logger = new Logger(RemindersCron.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Cada hora revisa reservas que son dentro de 24h y envía recordatorio.
   * Solo envía a reservas pending o confirmed que no han sido recordadas.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async sendReminders() {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);

    // Buscar reservas cuya fecha es mañana (ventana de 1 hora para evitar duplicados)
    const bookings = await this.bookingModel.find({
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.REAGENDADA] },
      reminderSent: { $ne: true },
      date: { $gte: in23h, $lte: in24h },
    })
      // el recordatorio lleva el enlace para mover el turno
      .select('+cancelToken')
      .lean();

    if (bookings.length === 0) return;

    this.logger.log(`Enviando ${bookings.length} recordatorios...`);

    for (const booking of bookings) {
      try {
        await this.notificationsService.sendBookingReminder(booking as any);
        await this.bookingModel.updateOne(
          { _id: booking._id },
          { $set: { reminderSent: true } },
        );
        this.logger.log(`Recordatorio enviado: ${booking.bookingCode}`);
      } catch (e) {
        this.logger.error(`Error recordatorio ${booking.bookingCode}: ${e.message}`);
      }
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
