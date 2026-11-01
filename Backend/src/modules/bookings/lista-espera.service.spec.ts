import { Types } from 'mongoose';
import { ListaEsperaService } from './lista-espera.service';
import { modeloEnMemoria } from '../../test-utils/modelo-memoria';

describe('ListaEsperaService', () => {
  const cancha = { _id: new Types.ObjectId(), isActive: true };
  let lista: any;
  let bookings: any;
  let bloqueos: any;
  let notifications: Record<string, jest.Mock>;
  let push: Record<string, jest.Mock>;
  let service: ListaEsperaService;
  const dia = new Date(2030, 2, 4);

  beforeEach(() => {
    lista = modeloEnMemoria();
    bookings = modeloEnMemoria();
    bloqueos = modeloEnMemoria();
    const courts = modeloEnMemoria();
    courts.docs.push(cancha);
    notifications = { sendTurnoLiberado: jest.fn(async () => undefined) };
    push = { enviar: jest.fn(async () => 1) };
    service = new ListaEsperaService(lista, bookings, courts, bloqueos, notifications as any, push as any);
    bookings.docs.push({
      _id: new Types.ObjectId(), courtId: cancha._id, date: dia, startTime: '19:00', endTime: '20:00', status: 'pending',
    });
  });

  const unirse = (extra: Record<string, unknown> = {}) => service.unirse({
    courtId: String(cancha._id), date: '2030-03-04', startTime: '19:00', endTime: '20:00',
    email: 'Ana@Correo.com', pushToken: 't'.repeat(30), ...extra,
  } as any);

  it('anota al jugador en un turno ocupado, sin duplicarlo', async () => {
    expect(await unirse()).toEqual({ ok: true, enEspera: 1 });
    expect(await unirse()).toEqual({ ok: true, enEspera: 1 });
    expect(await unirse({ email: 'otro@correo.com' })).toEqual({ ok: true, enEspera: 2 });
  });

  it('no anota en un turno libre ni en uno pasado', async () => {
    await expect(unirse({ startTime: '21:00', endTime: '22:00' })).rejects.toThrow('libre');
    await expect(unirse({ date: '2020-01-01' })).rejects.toThrow('ya pasó');
  });

  it('avisa una sola vez cuando el turno se libera', async () => {
    await unirse();
    await service.revisar();
    expect(notifications.sendTurnoLiberado).not.toHaveBeenCalled();

    bookings.docs.length = 0; // el pago no pasó y la reserva se borró
    await service.revisar();
    await service.revisar();
    expect(notifications.sendTurnoLiberado).toHaveBeenCalledTimes(1);
    expect(notifications.sendTurnoLiberado.mock.calls[0][0]).toMatchObject({ email: 'ana@correo.com', fecha: '2030-03-04' });
    expect(push.enviar).toHaveBeenCalledWith(['t'.repeat(30)], expect.objectContaining({ datos: expect.objectContaining({ tipo: 'turno-liberado' }) }));
  });

  it('un bloqueo del club también cuenta como ocupado', async () => {
    await unirse();
    bookings.docs.length = 0;
    bloqueos.docs.push({ courtId: cancha._id, date: dia, startTime: '18:00', endTime: '22:00' });
    await service.revisar();
    expect(notifications.sendTurnoLiberado).not.toHaveBeenCalled();
  });
});
