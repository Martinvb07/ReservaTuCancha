import { Controller, Post, Body, Headers, BadRequestException, Logger } from '@nestjs/common';
import { BookingsService } from '../bookings/bookings.service';
import { WompiService } from '../wompi/wompi.service';

@Controller('webhooks/wompi')
export class WompiWebhookController {
  private readonly logger = new Logger(WompiWebhookController.name);

  constructor(
    private readonly bookingsService: BookingsService,
    private readonly wompiService: WompiService,
  ) {}

  @Post()
  async handleWebhook(
    @Body() body: any,
    @Headers('x-event-checksum') checksum: string,
  ) {
    const { data, event, timestamp } = body;
    const transaction = data.transaction;

    // 1. Buscar la reserva por la referencia (bookingCode)
    const booking = await this.bookingsService.findByCode(transaction.reference);
    if (!booking) {
      this.logger.error(`Reserva no encontrada para la referencia: ${transaction.reference}`);
      throw new BadRequestException('Reserva no encontrada');
    }

    /* 2. La firma se valida con el secreto de eventos de la empresa: todos los
       cobros entran por la misma cuenta Wompi, ya no por la de cada club. */
    if (this.wompiService.eventsSecret) {
      if (!this.wompiService.validateSignature(data, timestamp, checksum)) {
        this.logger.error(`Firma inválida para la reserva: ${booking.bookingCode}`);
        throw new BadRequestException('Firma inválida');
      }
    } else {
      this.logger.warn('WOMPI_EVENTS_SECRET sin definir: se acepta el webhook sin validar firma');
    }

    // 3. Procesar el estado de la transacción
    if (event === 'transaction.updated') {
      if (transaction.status === 'APPROVED') {
        this.logger.log(`✅ Pago aprobado para reserva: ${booking.bookingCode}`);

        // Actualizamos la reserva a CONFIRMED y guardamos el ID de Wompi
        await this.bookingsService.updateStatus(booking._id.toString(), {
          status: 'confirmed',
          wompiTransactionId: transaction.id
        });
      } else if (transaction.status === 'DECLINED' || transaction.status === 'ERROR') {
        this.logger.warn(`❌ Pago rechazado/error para reserva: ${booking.bookingCode}`);
        await this.bookingsService.updateStatus(booking._id.toString(), {
          status: 'cancelled',
          wompiTransactionId: transaction.id,
        });
      }
    }

    return { status: 'received' };
  }
}
