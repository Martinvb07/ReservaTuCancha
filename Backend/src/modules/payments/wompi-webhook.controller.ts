import { Controller, Post, Body, Headers, BadRequestException, Logger } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { BookingsService } from '../bookings/bookings.service';
import { WompiService } from '../wompi/wompi.service';

/* Lo llama Wompi, no un navegador, y puede venir en rafagas al reintentar.
   La firma ya es la reja de esta ruta. */
@SkipThrottle()
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
    const { data, event, timestamp } = body ?? {};
    const transaction = data?.transaction;

    /* La ruta es pública: cualquiera puede golpearla. Sin esta guarda, un
       cuerpo vacío reventaba con un 500 y su traza en los logs. */
    if (!transaction?.reference) {
      throw new BadRequestException('Cuerpo del evento inválido');
    }

    /* 1. Primero la firma, antes de tocar la base: se valida con el secreto de
       eventos de la empresa, porque todos los cobros entran por la misma
       cuenta Wompi y ya no por la de cada club. Validar después permitía
       averiguar qué códigos de reserva existen sin credencial alguna.

       Falla cerrado: si WOMPI_EVENTS_SECRET no está puesta, validateSignature
       devuelve false y el evento se rechaza. Antes se procesaba igual, y con
       esa env vacía cualquiera confirmaba reservas sin pagar o borraba las
       ajenas mandando un DECLINED. */
    if (!this.wompiService.validateSignature(data, timestamp, checksum)) {
      this.logger.error(`Firma inválida para la referencia: ${transaction.reference}`);
      throw new BadRequestException('Firma inválida');
    }

    // 2. Buscar la reserva por la referencia (bookingCode)
    const booking = await this.bookingsService.findByCode(transaction.reference);
    if (!booking) {
      this.logger.error(`Reserva no encontrada para la referencia: ${transaction.reference}`);
      throw new BadRequestException('Reserva no encontrada');
    }

    // 3. Procesar el estado de la transacción
    if (event === 'transaction.updated') {
      if (transaction.status === 'APPROVED') {
        /* Lo cobrado tiene que coincidir con lo que vale el turno. La firma ya
           garantiza que el evento es de Wompi, pero esto ademas deja constancia
           si alguna vez el monto del checkout deja de calzar con la reserva. */
        const esperado = Math.round(booking.totalPrice * 100);
        const recibido = Number(transaction.amount_in_cents);
        if (recibido !== esperado) {
          this.logger.error(
            `Monto distinto en ${booking.bookingCode}: se esperaban ${esperado} centavos y llegaron ${recibido}. No se confirma.`,
          );
          throw new BadRequestException('El monto pagado no corresponde a la reserva');
        }

        this.logger.log(`✅ Pago aprobado para reserva: ${booking.bookingCode}`);

        // Actualizamos la reserva a CONFIRMED y guardamos el ID de Wompi
        await this.bookingsService.updateStatus(booking._id.toString(), {
          status: 'confirmed',
          wompiTransactionId: transaction.id
        });
      } else if (transaction.status === 'DECLINED' || transaction.status === 'ERROR') {
        this.logger.warn(`❌ Pago rechazado/error para reserva: ${booking.bookingCode}`);
        /* Sin estado "cancelada": una reserva que no se pagó se borra y el
           horario queda libre de inmediato. */
        await this.bookingsService.eliminar(booking._id.toString());
      }
    }

    return { status: 'received' };
  }
}
