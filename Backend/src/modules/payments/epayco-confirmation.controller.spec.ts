import { BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import { EpaycoConfirmationController } from './epayco-confirmation.controller';
import { EpaycoService } from '../epayco/epayco.service';
import { configCon } from '../../test-utils/config';

const CUST = '12345';
const PKEY = 'llave-de-prueba';

const firmar = (d: Record<string, string>) =>
  createHash('sha256')
    .update([CUST, PKEY, d.x_ref_payco, d.x_transaction_id, d.x_amount, d.x_currency_code].join('^'))
    .digest('hex');

/** Lo que ePayco manda al confirmar, ya firmado. */
const evento = (extra: Record<string, string> = {}): Record<string, string> => {
  const base: Record<string, string> = {
    x_ref_payco: '987654',
    x_transaction_id: 'TX-1',
    x_amount: '62000.00',
    x_currency_code: 'COP',
    x_extra1: 'ABCD1234',
    x_cod_response: '1',
    ...extra,
  };
  return { ...base, x_signature: extra.x_signature ?? firmar(base) };
};

describe('EpaycoConfirmationController', () => {
  let bookings: Record<string, jest.Mock>;
  let controller: EpaycoConfirmationController;
  let reserva: any;

  beforeEach(() => {
    reserva = { _id: { toString: () => 'id-reserva' }, bookingCode: 'ABCD1234', totalPrice: 62_000, status: 'pending' };
    bookings = {
      findByCode: jest.fn(async () => reserva),
      updateStatus: jest.fn(async () => ({})),
      eliminar: jest.fn(async () => undefined),
      avisarPagoHuerfano: jest.fn(async () => undefined),
      totalACobrar: jest.fn(async (b: any) => b.totalPrice),
    };
    const epayco = new EpaycoService(configCon({ EPAYCO_P_CUST_ID_CLIENTE: CUST, EPAYCO_P_KEY: PKEY }));
    controller = new EpaycoConfirmationController(bookings as any, epayco);
  });

  it('confirma la reserva pendiente cuando el pago es aprobado y el monto calza', async () => {
    await expect(controller.porPost(evento())).resolves.toEqual({ status: 'ok' });
    expect(bookings.updateStatus).toHaveBeenCalledWith('id-reserva', {
      status: 'confirmed',
      epaycoRefPayco: '987654',
      epaycoTransactionId: 'TX-1',
    });
  });

  it('acepta los reintentos por GET igual que el POST', async () => {
    await controller.porGet(evento());
    expect(bookings.updateStatus).toHaveBeenCalledTimes(1);
  });

  it('rechaza una firma inválida sin tocar la base', async () => {
    await expect(controller.porPost(evento({ x_signature: 'f'.repeat(64) }))).rejects.toThrow(BadRequestException);
    expect(bookings.findByCode).not.toHaveBeenCalled();
  });

  it('rechaza un monto alterado aunque la firma sea de otro monto', async () => {
    const e = evento();
    e.x_amount = '100.00';
    await expect(controller.porPost(e)).rejects.toThrow('Firma inválida');
  });

  it('falla cerrado si faltan las llaves en el entorno', async () => {
    const sinLlaves = new EpaycoConfirmationController(bookings as any, new EpaycoService(configCon()));
    await expect(sinLlaves.porPost(evento())).rejects.toThrow(BadRequestException);
    expect(bookings.updateStatus).not.toHaveBeenCalled();
  });

  it('rechaza un cuerpo vacío con 400, no con 500', async () => {
    await expect(controller.porPost({})).rejects.toThrow(BadRequestException);
    await expect(controller.porPost(undefined)).rejects.toThrow(BadRequestException);
  });

  it('no confirma si lo pagado no corresponde al total de la reserva', async () => {
    reserva.totalPrice = 70_000;
    await expect(controller.porPost(evento())).rejects.toThrow('El monto pagado no corresponde a la reserva');
    expect(bookings.updateStatus).not.toHaveBeenCalled();
  });

  it('un turno fijo se confirma con el total de todas sus fechas', async () => {
    bookings.totalACobrar.mockResolvedValueOnce(62_000);
    reserva.totalPrice = 15_500;
    await controller.porPost(evento());
    expect(bookings.updateStatus).toHaveBeenCalledTimes(1);

    bookings.totalACobrar.mockResolvedValueOnce(124_000);
    await expect(controller.porPost(evento())).rejects.toThrow('El monto pagado no corresponde a la reserva');
  });

  it('no confirma en otra moneda', async () => {
    await expect(controller.porPost(evento({ x_currency_code: 'USD' }))).rejects.toThrow('Moneda no soportada');
  });

  it('ignora la confirmación repetida de una reserva ya confirmada', async () => {
    reserva.status = 'confirmed';
    await expect(controller.porPost(evento())).resolves.toEqual({ status: 'ok' });
    expect(bookings.updateStatus).not.toHaveBeenCalled();
  });

  it('borra la reserva pendiente cuando el pago se rechaza o falla', async () => {
    await controller.porPost(evento({ x_cod_response: '2' }));
    await controller.porPost(evento({ x_cod_response: '4' }));
    expect(bookings.eliminar).toHaveBeenCalledTimes(2);
  });

  it('no borra una reserva ya pagada por un aviso tardío de un intento fallido', async () => {
    reserva.status = 'confirmed';
    await controller.porPost(evento({ x_cod_response: '2' }));
    expect(bookings.eliminar).not.toHaveBeenCalled();
  });

  it('deja en espera un pago pendiente (PSE)', async () => {
    await controller.porPost(evento({ x_cod_response: '3' }));
    expect(bookings.updateStatus).not.toHaveBeenCalled();
    expect(bookings.eliminar).not.toHaveBeenCalled();
  });

  it('avisa un pago aprobado que llegó cuando la reserva ya no existía', async () => {
    bookings.findByCode.mockResolvedValueOnce(null);
    await expect(controller.porPost(evento({ x_customer_email: 'jugador@correo.com' }))).resolves.toEqual({ status: 'ok' });
    expect(bookings.avisarPagoHuerfano).toHaveBeenCalledWith(
      expect.objectContaining({ codigo: 'ABCD1234', refPayco: '987654', email: 'jugador@correo.com' }),
    );
  });

  it('busca la reserva por x_id_factura si no viene extra1', async () => {
    await controller.porPost(evento({ x_extra1: '', x_id_factura: 'abcd1234' }));
    expect(bookings.findByCode).toHaveBeenCalledWith('ABCD1234');
  });
});
