import { Types } from 'mongoose';
import { RemindersCron, inicioDelTurno } from './reminders.cron';
import { modeloEnMemoria } from '../../test-utils/modelo-memoria';

describe('RemindersCron', () => {
  const cancha = { _id: new Types.ObjectId(), name: 'Cancha 1' };
  let bookings: any;
  let cron: RemindersCron;
  let notifications: Record<string, jest.Mock>;
  let push: Record<string, jest.Mock>;
  let whatsapp: Record<string, jest.Mock>;

  /** Una reserva que empieza dentro de `horas` horas, creada hace `creadaHace` horas. */
  const turnoEn = (horas: number, creadaHace = 48, extra: Record<string, unknown> = {}) => {
    const inicio = new Date(Date.now() + horas * 3_600_000);
    inicio.setMinutes(0, 0, 0);
    const fecha = new Date(inicio);
    fecha.setHours(0, 0, 0, 0);
    const doc = {
      _id: new Types.ObjectId(), courtId: cancha._id, bookingCode: `B${bookings.docs.length}`,
      guestName: 'Ana Pérez', guestPhone: '3001234567', pushToken: 'p'.repeat(30),
      date: fecha, startTime: `${String(inicio.getHours()).padStart(2, '0')}:00`,
      endTime: `${String((inicio.getHours() + 1) % 24).padStart(2, '0')}:00`,
      status: 'confirmed', createdAt: new Date(Date.now() - creadaHace * 3_600_000), ...extra,
    };
    bookings.docs.push(doc);
    return doc;
  };

  beforeEach(() => {
    bookings = modeloEnMemoria({ poblar: { courtId: () => [cancha] } });
    notifications = { sendBookingReminder: jest.fn(async () => undefined) };
    push = { enviar: jest.fn(async () => 1) };
    whatsapp = { recordatorio: jest.fn(async () => true) };
    cron = new RemindersCron(bookings, notifications as any, push as any, whatsapp as any);
  });

  it('calcula el inicio del turno desde la medianoche local y la hora', () => {
    expect(new Date(inicioDelTurno(new Date(2030, 2, 4), '19:30'))).toEqual(new Date(2030, 2, 4, 19, 30));
  });

  it('recuerda por correo, push y WhatsApp los turnos de las próximas 24 horas', async () => {
    const dentro = turnoEn(10);
    turnoEn(30); // todavía no
    await cron.sendReminders();
    expect(notifications.sendBookingReminder).toHaveBeenCalledTimes(1);
    expect(push.enviar).toHaveBeenCalledWith(['p'.repeat(30)], expect.objectContaining({ titulo: expect.stringContaining('Tu turno es') }));
    expect(whatsapp.recordatorio).toHaveBeenCalledWith('3001234567', expect.objectContaining({ nombre: 'Ana', cancha: 'Cancha 1' }));
    expect((dentro as any).reminderSent).toBe(true);
  });

  it('no repite el recordatorio ni se lo manda a quien acaba de reservar', async () => {
    turnoEn(10);
    turnoEn(5, 1);
    await cron.sendReminders();
    await cron.sendReminders();
    expect(notifications.sendBookingReminder).toHaveBeenCalledTimes(1);
  });

  it('si un canal falla los demás siguen', async () => {
    turnoEn(10);
    notifications.sendBookingReminder.mockRejectedValueOnce(new Error('Resend caído'));
    await cron.sendReminders();
    expect(whatsapp.recordatorio).toHaveBeenCalled();
  });
});
