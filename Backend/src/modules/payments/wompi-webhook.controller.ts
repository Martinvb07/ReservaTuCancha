import { Controller, Post, Body, Headers, BadRequestException, Logger } from '@nestjs/common';
import { BookingsService } from '../bookings/bookings.service';
import { WompiService } from '../wompi/wompi.service';
import { ClubsService } from '../clubs/clubs.service';

@Controller('webhooks/wompi')
export class WompiWebhookController {
  private readonly logger = new Logger(WompiWebhookController.name);

  constructor(
    private readonly bookingsService: BookingsService,
    private readonly wompiService: WompiService,
    private readonly clubsService: ClubsService,
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

    // 2. Obtener el club para validar la firma con su Secret de Eventos
    let club: any = null;
    try {
      const court = booking.courtId as any;
      const ownerId = court?.ownerUserId || court?.ownerId;
      if (ownerId) {
        club = await this.clubsService.findMyClub(ownerId.toString());
      }
    } catch (e) {
      this.logger.warn('No se pudo obtener el club para validar firma, se omite validación');
    }

    // Validación de firma (Opcional en desarrollo, Obligatorio en producción)
    if (club?.wompiEventsSecret) {
      const isValid = this.wompiService.validateSignature(
        data,
        timestamp,
        checksum,
        club.wompiEventsSecret
      );
      if (!isValid) {
        this.logger.error(`Firma inválida para la reserva: ${booking.bookingCode}`);
        throw new BadRequestException('Firma inválida');
      }
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

        // AQUÍ PODRÍAS DISPARAR EL ENVÍO DE EMAIL DE CONFIRMACIÓN
      } else if (transaction.status === 'DECLINED' || transaction.status === 'ERROR') {
        this.logger.warn(`❌ Pago rechazado/error para reserva: ${booking.bookingCode}`);
        // Opcional: marcar como cancelada o notificar al usuario
      }
    }

    return { status: 'received' };
  }
}