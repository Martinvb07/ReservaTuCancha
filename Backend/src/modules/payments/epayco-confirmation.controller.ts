import { Controller, Post, Get, Body, Query, BadRequestException, Logger } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { BookingsService } from '../bookings/bookings.service';
import { EpaycoService } from '../epayco/epayco.service';

/**
 * Códigos de respuesta de ePayco.
 * Solo el 1 mueve plata; el 3 queda pendiente (PSE, efectivo) y la reserva
 * sigue esperando hasta que llegue el evento definitivo.
 */
const ACEPTADA = '1';
const RECHAZADA = '2';
const FALLIDA = '4';

/* La llama ePayco, no un navegador, y puede repetir el aviso varias veces.
   La firma es la reja de esta ruta. */
@SkipThrottle()
@Controller('webhooks/epayco')
export class EpaycoConfirmationController {
  private readonly logger = new Logger(EpaycoConfirmationController.name);

  constructor(
    private readonly bookingsService: BookingsService,
    private readonly epaycoService: EpaycoService,
  ) {}

  /* ePayco manda la confirmación por POST, pero reintenta por GET cuando el
     POST falla. Las dos entran al mismo sitio. */
  @Post()
  async porPost(@Body() body: any) {
    return this.procesar(body ?? {});
  }

  @Get()
  async porGet(@Query() query: any) {
    return this.procesar(query ?? {});
  }

  private async procesar(datos: Record<string, any>) {
    const refPayco = String(datos.x_ref_payco ?? '');
    const transactionId = String(datos.x_transaction_id ?? '');
    const amount = String(datos.x_amount ?? '');
    const currency = String(datos.x_currency_code ?? '');
    const firma = String(datos.x_signature ?? '');

    /* La ruta es pública: cualquiera puede golpearla. Sin esta guarda un
       cuerpo vacío revienta con un 500 y su traza en los logs. */
    if (!refPayco || !transactionId) {
      throw new BadRequestException('Cuerpo de la confirmación inválido');
    }

    /* 1. Primero la firma, antes de tocar la base. Validar después permitiría
       averiguar qué códigos de reserva existen sin credencial alguna.

       Falla cerrado: sin las llaves en el entorno validarFirma devuelve false
       y el evento se rechaza, para que una env sin poner no alcance para
       confirmar reservas sin pagar o borrar las ajenas mandando una rechazada. */
    if (!this.epaycoService.validarFirma(firma, {
      x_ref_payco: refPayco,
      x_transaction_id: transactionId,
      x_amount: amount,
      x_currency_code: currency,
    })) {
      this.logger.error(`Firma inválida en la confirmación ${refPayco}`);
      throw new BadRequestException('Firma inválida');
    }

    /* 2. Buscar la reserva. extra1 es nuestro, x_id_factura lo normaliza
       ePayco; se prueban los dos por si alguna vez cambia el formato. */
    const codigo = String(datos.x_extra1 || datos.x_id_factura || '').trim().toUpperCase();
    if (!codigo) {
      this.logger.error(`Confirmación ${refPayco} sin código de reserva`);
      throw new BadRequestException('Confirmación sin referencia de reserva');
    }

    const booking = await this.bookingsService.findByCode(codigo);
    if (!booking) {
      this.logger.error(`Reserva no encontrada para la referencia: ${codigo}`);
      throw new BadRequestException('Reserva no encontrada');
    }

    const estado = String(datos.x_cod_response ?? datos.x_cod_transaction_state ?? '');

    if (estado === ACEPTADA) {
      /* Lo cobrado tiene que coincidir con lo que vale la reserva. La firma ya
         garantiza que el evento es de ePayco, pero esto deja constancia si
         alguna vez el monto de la sesión deja de calzar con la reserva.
         ePayco manda el monto con decimales ("62000.00"), así que se redondea
         antes de comparar. */
      const recibido = Math.round(Number(amount));
      if (!Number.isFinite(recibido) || recibido !== Math.round(booking.totalPrice)) {
        this.logger.error(
          `Monto distinto en ${booking.bookingCode}: se esperaban ${booking.totalPrice} y llegaron ${amount}. No se confirma.`,
        );
        throw new BadRequestException('El monto pagado no corresponde a la reserva');
      }

      if (currency && currency.toUpperCase() !== 'COP') {
        this.logger.error(`Moneda inesperada en ${booking.bookingCode}: ${currency}`);
        throw new BadRequestException('Moneda no soportada');
      }

      /* ePayco reintenta la confirmación; sin esta salida, una reserva ya
         confirmada volvería a disparar el correo al jugador en cada reintento. */
      if (booking.status !== 'pending') {
        this.logger.log(`Confirmación repetida para ${booking.bookingCode}, se ignora`);
        return { status: 'ok' };
      }

      this.logger.log(`Pago aprobado para la reserva ${booking.bookingCode}`);

      await this.bookingsService.updateStatus(booking._id.toString(), {
        status: 'confirmed',
        epaycoRefPayco: refPayco,
        epaycoTransactionId: transactionId,
      });
    } else if (estado === RECHAZADA || estado === FALLIDA) {
      this.logger.warn(`Pago rechazado para la reserva ${booking.bookingCode}`);
      /* Sin estado "cancelada": una reserva que no se pagó se borra y el
         horario queda libre de inmediato. Si ya estaba confirmada no se toca:
         un aviso tardío de un intento fallido anterior no debe borrar un
         turno que el jugador sí terminó pagando. */
      if (booking.status === 'pending') {
        await this.bookingsService.eliminar(booking._id.toString());
      }
    } else {
      /* Pendiente (PSE, efectivo): la reserva sigue en pending hasta que
         llegue el aviso definitivo o la limpie el cron de los 30 minutos. */
      this.logger.log(`Pago pendiente para la reserva ${booking.bookingCode} (estado ${estado})`);
    }

    return { status: 'ok' };
  }
}
