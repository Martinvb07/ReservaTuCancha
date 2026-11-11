import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument, BookingOrigen, BookingStatus } from './schemas/booking.schema';
import { ClienteBloqueado, ClienteBloqueadoDocument } from './schemas/cliente-bloqueado.schema';
import { Court, CourtDocument } from '../courts/schemas/court.schema';
import { aObjectId } from '../../common/utils/objectid.util';
import { BloquearClienteDto } from './dto/panel-club.dto';

/** Celular en solo dígitos y sin indicativo: "+57 300 123 4567" → "3001234567". */
export const telefonoClave = (tel?: string | null): string => {
  const digitos = String(tel ?? '').replace(/\D/g, '');
  return digitos.length > 10 ? digitos.slice(-10) : digitos;
};
const emailClave = (email?: string | null): string => String(email ?? '').trim().toLowerCase();

export interface ClienteDelClub {
  clave: string;
  nombre: string;
  telefono: string;
  email: string;
  reservas: number;
  /** Lo que le ha entrado al club por este cliente. */
  gastado: number;
  noShows: number;
  primeraReserva: string;
  ultimaReserva: string;
  bloqueado: boolean;
  bloqueoId?: string;
}

/**
 * Lo que el club ve de su negocio más allá del listado de reservas: quiénes
 * son sus clientes, quién le falla y cuánto le entró en un rango de fechas.
 */
@Injectable()
export class PanelClubService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Court.name) private courtModel: Model<CourtDocument>,
    @InjectModel(ClienteBloqueado.name) private bloqueadoModel: Model<ClienteBloqueadoDocument>,
  ) {}

  private async canchasDe(ownerId: string) {
    return this.courtModel.find({ ownerId: new Types.ObjectId(ownerId) }).select('_id name').lean();
  }

  /** Lo que le queda al club de una reserva (las viejas no traen netoDueno). */
  private static ingreso(b: any): number {
    if (b.origen === BookingOrigen.MANUAL) return b.precioCancha ?? b.totalPrice ?? 0;
    return b.netoDueno || b.precioCancha || b.totalPrice || 0;
  }

  // ─── CLIENTES ─────────────────────────────────────────────────────────

  /**
   * Los clientes del club, armados a partir de sus reservas. Una persona es
   * la misma si coincide el celular; si no hay celular, el correo; y si la
   * anotó el club solo con el nombre, el nombre.
   */
  async clientes(ownerId: string): Promise<ClienteDelClub[]> {
    const canchas = await this.canchasDe(ownerId);
    const [reservas, bloqueos] = await Promise.all([
      this.bookingModel
        .find({ courtId: { $in: canchas.map((c) => c._id) }, status: { $ne: BookingStatus.PENDING } })
        .select('guestName guestPhone guestEmail date origen precioCancha totalPrice netoDueno noShow')
        .sort({ date: 1 })
        .lean(),
      this.bloqueadoModel.find({ ownerId: new Types.ObjectId(ownerId) }).lean(),
    ]);

    const mapa = new Map<string, ClienteDelClub>();
    for (const b of reservas as any[]) {
      const tel = telefonoClave(b.guestPhone);
      const mail = emailClave(b.guestEmail);
      const clave = tel ? `t:${tel}` : mail ? `e:${mail}` : `n:${String(b.guestName ?? '').trim().toLowerCase()}`;
      const fecha = new Date(b.date).toISOString();
      let c = mapa.get(clave);
      if (!c) {
        c = {
          clave, nombre: b.guestName ?? '', telefono: tel, email: mail,
          reservas: 0, gastado: 0, noShows: 0,
          primeraReserva: fecha, ultimaReserva: fecha, bloqueado: false,
        };
        mapa.set(clave, c);
      }
      c.reservas += 1;
      c.gastado += PanelClubService.ingreso(b);
      if (b.noShow) c.noShows += 1;
      c.ultimaReserva = fecha;
      /* Se queda con el nombre y el correo más recientes. */
      if (b.guestName) c.nombre = b.guestName;
      if (mail) c.email = mail;
    }

    const lista = [...mapa.values()];
    for (const c of lista) {
      const bloqueo = bloqueos.find(
        (x) => (x.telefono && x.telefono === c.telefono) || (x.email && x.email === c.email),
      );
      if (bloqueo) {
        c.bloqueado = true;
        c.bloqueoId = String(bloqueo._id);
      }
    }
    /* Bloqueos de gente que aún no tiene reservas visibles también se listan,
       para que el club pueda quitarlos. */
    for (const x of bloqueos) {
      if (lista.some((c) => c.bloqueoId === String(x._id))) continue;
      const creado = new Date((x as any).createdAt ?? Date.now()).toISOString();
      lista.push({
        clave: `b:${x._id}`, nombre: x.nombre ?? '', telefono: x.telefono ?? '', email: x.email ?? '',
        reservas: 0, gastado: 0, noShows: 0, primeraReserva: creado, ultimaReserva: creado,
        bloqueado: true, bloqueoId: String(x._id),
      });
    }
    return lista.sort((a, b) => b.reservas - a.reservas || b.gastado - a.gastado);
  }

  async bloquear(ownerId: string, dto: BloquearClienteDto) {
    const telefono = telefonoClave(dto.telefono);
    const email = emailClave(dto.email);
    if (!telefono && !email) {
      throw new BadRequestException('Para bloquear a un cliente hace falta su celular o su correo');
    }
    const owner = new Types.ObjectId(ownerId);
    const ya = await this.bloqueadoModel.findOne({
      ownerId: owner,
      $or: [...(telefono ? [{ telefono }] : []), ...(email ? [{ email }] : [])],
    });
    if (ya) return ya;
    return new this.bloqueadoModel({
      ownerId: owner,
      telefono: telefono || undefined,
      email: email || undefined,
      nombre: dto.nombre,
      motivo: dto.motivo,
    }).save();
  }

  async desbloquear(ownerId: string, id: string) {
    const r = await this.bloqueadoModel.deleteOne({
      _id: aObjectId(id, 'Bloqueo no encontrado'),
      ownerId: new Types.ObjectId(ownerId),
    });
    if (!r.deletedCount) throw new NotFoundException('Bloqueo no encontrado');
    return { ok: true };
  }

  /** ¿Este club bloqueó a quien intenta reservar? Lo consulta la reserva en línea. */
  async estaBloqueado(ownerId: Types.ObjectId | string, telefono?: string, email?: string): Promise<boolean> {
    const tel = telefonoClave(telefono);
    const mail = emailClave(email);
    if (!tel && !mail) return false;
    const hay = await this.bloqueadoModel.exists({
      ownerId: new Types.ObjectId(String(ownerId)),
      $or: [...(tel ? [{ telefono: tel }] : []), ...(mail ? [{ email: mail }] : [])],
    });
    return !!hay;
  }

  // ─── NO LLEGÓ ─────────────────────────────────────────────────────────

  async marcarNoShow(ownerId: string, bookingId: string, noShow: boolean) {
    const booking = await this.bookingModel
      .findById(aObjectId(bookingId, 'Reserva no encontrada'))
      .populate('courtId', 'ownerId');
    if (!booking) throw new NotFoundException('Reserva no encontrada');
    if (String((booking.courtId as any)?.ownerId) !== String(ownerId)) {
      throw new ForbiddenException('No tienes permiso para modificar esta reserva');
    }
    if (booking.status === BookingStatus.PENDING) {
      throw new BadRequestException('Esta reserva todavía no está pagada');
    }
    await this.bookingModel.updateOne({ _id: booking._id }, { $set: { noShow } });
    return { ok: true, noShow };
  }

  // ─── CAJA ─────────────────────────────────────────────────────────────

  /**
   * Lo que le entró al club entre dos fechas (inclusive): lo pagado en línea,
   * ya con los costos descontados, y lo que cobró en el club.
   */
  async caja(ownerId: string, desde: string, hasta: string) {
    const YMD = /^\d{4}-\d{2}-\d{2}$/;
    if (!YMD.test(desde) || !YMD.test(hasta)) throw new BadRequestException('Fechas inválidas (YYYY-MM-DD)');
    if (hasta < desde) throw new BadRequestException('La fecha final debe ser igual o posterior a la inicial');
    const aFecha = (ymd: string, sumar = 0) => {
      const [y, m, d] = ymd.split('-').map(Number);
      return new Date(y, m - 1, d + sumar);
    };
    const inicio = aFecha(desde);
    const fin = aFecha(hasta, 1);
    if ((fin.getTime() - inicio.getTime()) / 86_400_000 > 370) {
      throw new BadRequestException('El rango máximo es de un año');
    }

    const canchas = await this.canchasDe(ownerId);
    const nombres = new Map(canchas.map((c) => [String(c._id), c.name]));
    const reservas = await this.bookingModel
      .find({
        courtId: { $in: canchas.map((c) => c._id) },
        status: { $ne: BookingStatus.PENDING },
        date: { $gte: inicio, $lt: fin },
      })
      .select('courtId guestName guestPhone date startTime endTime origen status bookingCode precioCancha totalPrice tarifaServicio costoPasarela gananciaPlataforma netoDueno medioPagoClub noShow')
      .sort({ date: 1, startTime: 1 })
      .lean();

    const ymd = (f: Date) =>
      `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;

    const movimientos = (reservas as any[]).map((b) => {
      const enClub = b.origen === BookingOrigen.MANUAL;
      return {
        _id: String(b._id),
        fecha: ymd(new Date(b.date)),
        inicio: b.startTime,
        fin: b.endTime,
        cancha: nombres.get(String(b.courtId)) ?? '',
        cliente: b.guestName ?? '',
        telefono: b.guestPhone ?? '',
        codigo: b.bookingCode,
        origen: enClub ? 'club' : 'online',
        medio: enClub ? (b.medioPagoClub ?? 'efectivo') : 'en línea',
        precio: b.precioCancha ?? b.totalPrice ?? 0,
        /* Solo en las reservas en línea: pasarela + plataforma, menos la
           tarifa que pagó el jugador. */
        descuentos: enClub ? 0 : Math.max(0, (b.precioCancha ?? b.totalPrice ?? 0) - PanelClubService.ingreso(b)),
        ingreso: PanelClubService.ingreso(b),
        noShow: !!b.noShow,
      };
    });

    const suma = (f: (m: (typeof movimientos)[number]) => boolean) =>
      movimientos.filter(f).reduce((acc, m) => acc + m.ingreso, 0);
    const porMedio: Record<string, number> = {};
    for (const m of movimientos) porMedio[m.medio] = (porMedio[m.medio] ?? 0) + m.ingreso;

    return {
      desde,
      hasta,
      totales: {
        reservas: movimientos.length,
        enLinea: suma((m) => m.origen === 'online'),
        enClub: suma((m) => m.origen === 'club'),
        total: suma(() => true),
        porMedio,
      },
      movimientos,
    };
  }
}
