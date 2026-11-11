import { BadRequestException, ConflictException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CajaTurnoService, instantesDelTurno } from './caja-turno.service';
import { modeloEnMemoria } from '../../test-utils/modelo-memoria';

/** Un instante dado en hora Colombia (UTC-5). */
const col = (dia: number, hora: number, min = 0) => new Date(Date.UTC(2030, 2, dia, hora + 5, min));

describe('CajaTurnoService', () => {
  const ownerId = new Types.ObjectId();
  const cancha = { _id: new Types.ObjectId(), ownerId, name: 'Cancha 1' };
  let turnoModel: any;
  let bookingModel: any;
  let notifications: { sendCierreCaja: jest.Mock };
  let service: CajaTurnoService;
  let ahora: Date;

  const reserva = (hora: string, fin: string, extra: Record<string, unknown> = {}) => {
    bookingModel.docs.push({
      _id: new Types.ObjectId(), courtId: cancha._id, guestName: 'Ana', date: new Date(2030, 2, 4),
      startTime: hora, endTime: fin, status: 'confirmed', origen: 'manual', medioPagoClub: 'efectivo',
      precioCancha: 60_000, totalPrice: 60_000, netoDueno: 60_000, bookingCode: 'ABC12345', ...extra,
    });
  };

  beforeEach(() => {
    turnoModel = modeloEnMemoria();
    bookingModel = modeloEnMemoria();
    const courtModel = modeloEnMemoria();
    courtModel.docs.push(cancha);
    const userModel = modeloEnMemoria();
    userModel.docs.push({ _id: ownerId, email: 'dueno@club.com', name: 'Dueño' });
    const clubModel = modeloEnMemoria();
    clubModel.docs.push({ _id: new Types.ObjectId(), ownerUserId: ownerId, name: 'Club' });
    notifications = { sendCierreCaja: jest.fn(async () => undefined) };
    service = new CajaTurnoService(turnoModel, bookingModel, courtModel, userModel, clubModel, notifications as any);
    ahora = col(4, 8);
    jest.useFakeTimers().setSystemTime(ahora);
  });
  afterEach(() => jest.useRealTimers());

  it('la hora del turno se lee como hora Colombia', () => {
    const { inicio, fin } = instantesDelTurno({ date: new Date(2030, 2, 4), startTime: '19:00', endTime: '20:00' });
    expect(inicio.toISOString()).toBe('2030-03-05T00:00:00.000Z');
    expect(fin.getTime() - inicio.getTime()).toBe(3_600_000);
  });

  it('no deja abrir dos cajas ni mover plata sin caja abierta', async () => {
    await expect(service.movimiento(String(ownerId), { tipo: 'gasto', concepto: 'Agua', valor: 1000 }, 'Paola'))
      .rejects.toBeInstanceOf(BadRequestException);
    await service.abrir(String(ownerId), 50_000, 'Paola');
    await expect(service.abrir(String(ownerId), 0, 'Paola')).rejects.toBeInstanceOf(ConflictException);
  });

  it('suma al cajón solo el efectivo del turno y avisa la diferencia al cerrar', async () => {
    await service.abrir(String(ownerId), 50_000, 'Paola'); // abre a las 8:00

    reserva('07:00', '07:50');                                    // antes de abrir: no cuenta
    reserva('09:00', '10:00');                                    // efectivo
    reserva('10:00', '11:00', { medioPagoClub: 'transferencia' }); // no está en el cajón
    reserva('11:00', '12:00', { noShow: true });                  // no llegó: no pagó
    reserva('12:00', '13:00', { origen: 'online', netoDueno: 56_000, medioPagoClub: undefined });
    reserva('20:00', '21:00');                                    // después del cierre: no cuenta

    jest.setSystemTime(col(4, 13, 30));
    await service.movimiento(String(ownerId), { tipo: 'ingreso', concepto: 'Hidratación', valor: 12_000 }, 'Paola');
    await service.movimiento(String(ownerId), { tipo: 'gasto', concepto: 'Aseo', valor: 5_000 }, 'Paola');

    jest.setSystemTime(col(4, 14));
    const cerrada: any = await service.cerrar(String(ownerId), { efectivoContado: 115_000 }, 'Paola');

    expect(cerrada.cierre.reservas).toHaveLength(4);
    expect(cerrada.cierre.efectivoReservas).toBe(60_000);
    expect(cerrada.cierre.otrosMedios).toBe(60_000);
    expect(cerrada.cierre.enLinea).toBe(56_000);
    expect(cerrada.cierre.efectivoEsperado).toBe(50_000 + 60_000 + 12_000 - 5_000);
    expect(cerrada.cierre.diferencia).toBe(-2_000);
    expect(notifications.sendCierreCaja).toHaveBeenCalledWith(expect.objectContaining({ email: 'dueno@club.com' }));
    expect(await service.actual(String(ownerId))).toBeNull();
  });

  it('el turno del cambio de caja queda en la caja que lo vio empezar', async () => {
    await service.abrir(String(ownerId), 0, 'Mañana');
    reserva('13:30', '14:30');
    jest.setSystemTime(col(4, 14));
    const primera: any = await service.cerrar(String(ownerId), { efectivoContado: 60_000 }, 'Mañana');
    expect(primera.cierre.reservas).toHaveLength(1);

    await service.abrir(String(ownerId), 0, 'Tarde');
    jest.setSystemTime(col(4, 18));
    const segunda = await service.actual(String(ownerId));
    expect(segunda!.resumen.reservas).toHaveLength(0);
  });
});
