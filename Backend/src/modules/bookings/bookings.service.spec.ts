import { ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { BookingsService } from './bookings.service';
import { CobrosService } from '../cobros/cobros.service';
import { configCon } from '../../test-utils/config';
import { modeloEnMemoria } from '../../test-utils/modelo-memoria';

/** Un día hábil lejano (lunes), para que nunca caiga en el pasado. */
const LUNES = '2030-03-04';

describe('BookingsService', () => {
  const ownerId = new Types.ObjectId();
  const otroOwner = new Types.ObjectId();
  let canchas: any[];
  let bookingModel: any;
  let blockedModel: any;
  let service: BookingsService;
  let notifications: Record<string, jest.Mock>;
  let push: Record<string, jest.Mock>;
  let epayco: any;
  let cancha: any;

  beforeEach(() => {
    cancha = { _id: new Types.ObjectId(), name: 'Cancha 1', ownerId, pricePerHour: 60_000, isActive: true };
    canchas = [cancha];
    const courtModel = modeloEnMemoria();
    courtModel.docs.push(cancha);
    bookingModel = modeloEnMemoria({ poblar: { courtId: () => canchas } });
    blockedModel = modeloEnMemoria();
    const clubModel = modeloEnMemoria();
    clubModel.docs.push({ _id: new Types.ObjectId(), ownerUserId: ownerId, epaycoReceptorId: 'REC-1', name: 'Club' });
    notifications = {
      sendBookingConfirmation: jest.fn(async () => undefined),
      sendOwnerNewBookingNotification: jest.fn(async () => undefined),
      sendReviewRequest: jest.fn(async () => undefined),
    };
    push = { enviar: jest.fn(async () => 0), enviarAlClub: jest.fn(async () => 0) };
    epayco = {
      configured: true,
      splitActivo: true,
      testMode: false,
      publicKey: 'pk',
      crearSesion: jest.fn(async () => 'sesion-1'),
    };
    const userModel = modeloEnMemoria();
    userModel.docs.push({ _id: ownerId, email: 'dueno@club.com' });

    service = new BookingsService(
      bookingModel,
      clubModel,
      courtModel,
      userModel,
      blockedModel,
      notifications as any,
      epayco,
      new CobrosService(configCon()),
      { notifyNewBooking: jest.fn() } as any,
      push as any,
    );
  });

  const reservar = (extra: Record<string, unknown> = {}) =>
    service.create({
      courtId: String(cancha._id),
      guestName: 'Ana',
      guestEmail: 'ana@correo.com',
      guestPhone: '3001234567',
      date: LUNES,
      startTime: '19:00',
      endTime: '20:00',
      ...extra,
    } as any);

  describe('reserva suelta', () => {
    it('nace pendiente con el precio de la cancha y sin tokens en la respuesta', async () => {
      const r: any = await reservar({ totalPrice: 1, pushToken: 'x'.repeat(30) });
      expect(r).toMatchObject({ status: 'pending', precioCancha: 60_000, totalPrice: 62_000, origen: 'online' });
      expect(r.cancelToken).toBeUndefined();
      expect(r.reviewToken).toBeUndefined();
      expect(r.pushToken).toBeUndefined();
      expect(r.serie).toBeUndefined();
      expect(bookingModel.docs[0].pushToken).toBe('x'.repeat(30));
    });

    it('no deja reservar un turno ocupado ni uno bloqueado', async () => {
      await reservar();
      await expect(reservar({ startTime: '19:30', endTime: '20:30' })).rejects.toThrow(ConflictException);
      blockedModel.docs.push({ courtId: cancha._id, date: new Date(2030, 2, 4), startTime: '21:00', endTime: '22:00' });
      await expect(reservar({ startTime: '21:00', endTime: '22:00' })).rejects.toThrow('bloqueado');
    });

    it('rechaza fechas pasadas', async () => {
      await expect(reservar({ date: '2020-01-01' })).rejects.toThrow('ya pasó');
    });
  });

  describe('turno fijo', () => {
    it('crea una reserva por semana con la misma serie', async () => {
      const r: any = await reservar({ semanas: 4 });
      expect(bookingModel.docs).toHaveLength(4);
      const fechas = bookingModel.docs.map((b: any) => b.date.getDate());
      expect(fechas).toEqual([4, 11, 18, 25]);
      expect(new Set(bookingModel.docs.map((b: any) => b.serieId)).size).toBe(1);
      expect(new Set(bookingModel.docs.map((b: any) => b.bookingCode)).size).toBe(4);
      expect(r.serie).toEqual({
        id: bookingModel.docs[0].serieId,
        semanas: 4,
        fechas: ['2030-03-04', '2030-03-11', '2030-03-18', '2030-03-25'],
        total: 4 * 62_000,
      });
    });

    it('si alguna semana choca no reserva ninguna y dice cuál', async () => {
      bookingModel.docs.push({
        _id: new Types.ObjectId(), courtId: cancha._id, date: new Date(2030, 2, 18),
        startTime: '19:00', endTime: '20:00', status: 'confirmed',
      });
      await expect(reservar({ semanas: 4 })).rejects.toThrow(/18 de mar/);
      expect(bookingModel.docs).toHaveLength(1);
    });

    it('se paga en un solo cobro y el split suma exacto', async () => {
      const r: any = await reservar({ semanas: 3 });
      await service.initPayment(String(r._id), 'https://reservatucancha.site/x');
      const sesion = epayco.crearSesion.mock.calls[0][0];
      expect(sesion.total).toBe(3 * 62_000);
      expect(sesion.invoice).toBe(r.bookingCode);
      expect(sesion.split.netoDueno + sesion.split.gananciaPlataforma + sesion.split.costoPasarela).toBe(sesion.total);
      expect(sesion.split.gananciaPlataforma).toBe(3 * 2_250);
      expect(await service.totalACobrar(bookingModel.docs[0])).toBe(3 * 62_000);
    });

    it('al confirmarse el pago se confirman todas las fechas con un solo correo', async () => {
      const r: any = await reservar({ semanas: 3 });
      await service.updateStatus(String(r._id), { status: 'confirmed', epaycoRefPayco: 'REF' });
      expect(bookingModel.docs.every((b: any) => b.status === 'confirmed' && b.epaycoRefPayco === 'REF')).toBe(true);
      expect(notifications.sendBookingConfirmation).toHaveBeenCalledTimes(1);
      const resumen = notifications.sendBookingConfirmation.mock.calls[0][1];
      expect(resumen.fechas).toHaveLength(3);
      expect(resumen.total).toBe(3 * 62_000);
      expect(push.enviarAlClub).toHaveBeenCalledTimes(1);
    });

    it('si el pago se rechaza se borran todas las fechas', async () => {
      const r: any = await reservar({ semanas: 3 });
      await service.eliminar(String(r._id));
      expect(bookingModel.docs).toHaveLength(0);
    });

    it('no vuelve a abrir el cobro de una reserva ya pagada', async () => {
      const r: any = await reservar();
      bookingModel.docs[0].status = 'confirmed';
      await expect(service.initPayment(String(r._id), '')).rejects.toThrow(BadRequestException);
    });
  });

  describe('reservas que anota el club', () => {
    const manual = (extra: Record<string, unknown> = {}, owner = ownerId) =>
      service.crearManual(String(owner), {
        courtId: String(cancha._id), date: LUNES, startTime: '18:00', endTime: '19:00', guestName: 'Los martes',
        ...extra,
      } as any);

    it('queda confirmada, sin cargos de plataforma, y ocupa el horario', async () => {
      const r = await manual();
      expect(r.creadas).toBe(1);
      expect(bookingModel.docs[0]).toMatchObject({
        origen: 'manual', status: 'confirmed', paymentMethod: 'club',
        tarifaServicio: 0, costoPasarela: 0, gananciaPlataforma: 0, netoDueno: 60_000, totalPrice: 60_000,
      });
      await expect(reservar({ startTime: '18:00', endTime: '19:00' })).rejects.toThrow(ConflictException);
    });

    it('respeta el precio que cobra el club y repite por semanas', async () => {
      await manual({ precio: 50_000, semanas: 3 });
      expect(bookingModel.docs).toHaveLength(3);
      expect(bookingModel.docs.every((b: any) => b.netoDueno === 50_000)).toBe(true);
    });

    it('solo el dueño de la cancha puede anotarla', async () => {
      await expect(manual({}, otroOwner)).rejects.toThrow(ForbiddenException);
    });

    it('se anula sola o desde esa fecha en adelante, pero nunca una pagada en línea', async () => {
      await manual({ semanas: 4 });
      const [, segunda] = bookingModel.docs;
      await service.anularManual(String(ownerId), String(segunda._id), true);
      expect(bookingModel.docs).toHaveLength(1);

      const online: any = await reservar({ startTime: '20:00', endTime: '21:00' });
      await expect(service.anularManual(String(ownerId), String(online._id))).rejects.toThrow('anotó el club');
    });
  });
});
