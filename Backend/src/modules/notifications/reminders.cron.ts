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
      status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      reminderSent: { $ne: true },
      date: { $gte: in23h, $lte: in24h },
    }).lean();

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
}
