import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument, BookingOrigen, BookingStatus } from './schemas/booking.schema';
import { CajaTurno, CajaTurnoDocument } from './schemas/caja-turno.schema';
import { Court, CourtDocument } from '../courts/schemas/court.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Club, ClubDocument } from '../clubs/schemas/club.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { aObjectId } from '../../common/utils/objectid.util';

/** Colombia no cambia la hora: siempre UTC-5. */
const COLOMBIA_UTC = 5;

/**
 * Cuándo empieza y termina un turno reservado, como instante real.
 * La fecha de la reserva guarda el día; la hora va aparte y es hora Colombia.
 */
export function instantesDelTurno(b: { date: Date; startTime: string; endTime: string }): { inicio: Date; fin: Date } {
  const f = new Date(b.date);
  const en = (hhmm: string, sumarDia = 0) => {
    const [h, m] = String(hhmm).split(':').map(Number);
    return new Date(Date.UTC(f.getFullYear(), f.getMonth(), f.getDate() + sumarDia, (h || 0) + COLOMBIA_UTC, m || 0));
  };
  const inicio = en(b.startTime);
  let fin = en(b.endTime);
  if (fin <= inicio) fin = en(b.endTime, 1); // termina a medianoche
  return { inicio, fin };
}

export interface ResumenCaja {
  base: number;
  reservas: {
    _id: string; inicio: string; fin: string; fecha: string; cancha: string; cliente: string;
    codigo: string; origen: 'club' | 'online'; medio: string; valor: number; noShow: boolean;
  }[];
  /** Cobrado en el club en efectivo: es lo que tiene que estar en el cajón. */
  efectivoReservas: number;
  /** Cobrado en el club por transferencia o tarjeta: no está en el cajón. */
  otrosMedios: number;
  /** Pagado en línea (ya con descuentos): llega por ePayco, no por la caja. */
  enLinea: number;
  ingresos: number;
  gastos: number;
  /** base + efectivo de reservas + ingresos − gastos */
  efectivoEsperado: number;
  /** Todo lo que entró en el turno, por cualquier medio, menos los gastos. */
  totalTurno: number;
}

@Injectable()
export class CajaTurnoService {
  private readonly logger = new Logger(CajaTurnoService.name);

  constructor(
    @InjectModel(CajaTurno.name) private turnoModel: Model<CajaTurnoDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Court.name) private courtModel: Model<CourtDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Club.name) private clubModel: Model<ClubDocument>,
    private readonly notifications: NotificationsService,
  ) {}

  private abierta(ownerId: string) {
    return this.turnoModel.findOne({ ownerId: new Types.ObjectId(ownerId), cerradaEn: { $exists: false } });
  }

  /**
   * Lo que junta un turno de caja entre su apertura y `hasta`.
   *
   * Una reserva entra al turno si se juega mientras la caja está abierta. Si
   * empezó antes de que cerrara la caja anterior, es de esa y no de esta: así
   * el turno del cambio de caja no se cuenta dos veces.
   */
  async resumen(turno: CajaTurnoDocument | (CajaTurno & { _id: any }), hasta: Date): Promise<ResumenCaja> {
    const canchas = await this.courtModel.find({ ownerId: turno.ownerId }).select('_id name').lean();
    const nombres = new Map(canchas.map((c) => [String(c._id), c.name]));

    const anterior = await this.turnoModel
      .findOne({ ownerId: turno.ownerId, cerradaEn: { $lte: turno.abiertaEn } })
      .sort({ cerradaEn: -1 })
      .select('cerradaEn')
      .lean();
    const corte = anterior?.cerradaEn ? new Date(anterior.cerradaEn) : null;

    const unDia = 36 * 3_600_000; // margen por zona horaria y turnos de medianoche
    const candidatas = await this.bookingModel
      .find({
        courtId: { $in: canchas.map((c) => c._id) },
        status: { $ne: BookingStatus.PENDING },
        date: { $gte: new Date(turno.abiertaEn.getTime() - unDia), $lte: new Date(hasta.getTime() + unDia) },
      })
      .select('courtId guestName date startTime endTime origen bookingCode precioCancha totalPrice netoDueno medioPagoClub noShow')
      .lean();

    const reservas: ResumenCaja['reservas'] = [];
    for (const b of candidatas as any[]) {
      const { inicio, fin } = instantesDelTurno(b);
      if (!(inicio < hasta && fin > turno.abiertaEn)) continue;
      if (corte && inicio < corte) continue;
      const enClub = b.origen === BookingOrigen.MANUAL;
      const f = new Date(b.date);
      reservas.push({
        _id: String(b._id),
        inicio: b.startTime,
        fin: b.endTime,
        fecha: `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`,
        cancha: nombres.get(String(b.courtId)) ?? '',
        cliente: b.guestName ?? '',
        codigo: b.bookingCode,
        origen: enClub ? 'club' : 'online',
        medio: enClub ? (b.medioPagoClub ?? 'efectivo') : 'en línea',
        valor: enClub ? (b.precioCancha ?? b.totalPrice ?? 0) : (b.netoDueno || b.precioCancha || b.totalPrice || 0),
        noShow: !!b.noShow,
      });
    }
    reservas.sort((a, b) => (a.fecha + a.inicio).localeCompare(b.fecha + b.inicio));

    /* Quien no llegó a una reserva del club no pagó: no suma a la caja. */
    const cobradas = reservas.filter((r) => !(r.origen === 'club' && r.noShow));
    const suma = (f: (r: ResumenCaja['reservas'][number]) => boolean) =>
      cobradas.filter(f).reduce((acc, r) => acc + r.valor, 0);
    const efectivoReservas = suma((r) => r.origen === 'club' && r.medio === 'efectivo');
    const otrosMedios = suma((r) => r.origen === 'club' && r.medio !== 'efectivo');
    const enLinea = suma((r) => r.origen === 'online');
    const movs = (turno.movimientos ?? []).filter((m) => new Date(m.fecha) <= hasta);
    const ingresos = movs.filter((m) => m.tipo === 'ingreso').reduce((a, m) => a + m.valor, 0);
    const gastos = movs.filter((m) => m.tipo === 'gasto').reduce((a, m) => a + m.valor, 0);

    return {
      base: turno.base,
      reservas,
      efectivoReservas,
      otrosMedios,
      enLinea,
      ingresos,
      gastos,
      efectivoEsperado: turno.base + efectivoReservas + ingresos - gastos,
      totalTurno: efectivoReservas + otrosMedios + enLinea + ingresos - gastos,
    };
  }

  /** La caja abierta con su resumen en vivo, o null si no hay ninguna. */
  async actual(ownerId: string) {
    const turno = await this.abierta(ownerId);
    if (!turno) return null;
    return { turno: turno.toObject(), resumen: await this.resumen(turno, new Date()) };
  }

  async abrir(ownerId: string, base: number, por: string) {
    if (await this.abierta(ownerId)) {
      throw new ConflictException('Ya hay una caja abierta. Ciérrala antes de abrir otra.');
    }
    const turno = await new this.turnoModel({
      ownerId: new Types.ObjectId(ownerId),
      abiertaEn: new Date(),
      abiertaPor: por,
      base,
      movimientos: [],
    }).save();
    return { turno: turno.toObject(), resumen: await this.resumen(turno, new Date()) };
  }

  async movimiento(ownerId: string, datos: { tipo: 'ingreso' | 'gasto'; concepto: string; valor: number }, por: string) {
    const turno = await this.abierta(ownerId);
    if (!turno) throw new BadRequestException('Abre la caja antes de registrar movimientos');
    turno.movimientos = [
      ...(turno.movimientos ?? []),
      { ...datos, concepto: datos.concepto.trim(), fecha: new Date(), por },
    ] as any;
    await turno.save();
    return { turno: turno.toObject(), resumen: await this.resumen(turno, new Date()) };
  }

  async quitarMovimiento(ownerId: string, movimientoId: string) {
    const turno = await this.abierta(ownerId);
    if (!turno) throw new BadRequestException('No hay una caja abierta');
    const antes = turno.movimientos.length;
    turno.movimientos = turno.movimientos.filter((m: any) => String(m._id) !== movimientoId) as any;
    if (turno.movimientos.length === antes) throw new NotFoundException('Movimiento no encontrado');
    await turno.save();
    return { turno: turno.toObject(), resumen: await this.resumen(turno, new Date()) };
  }

  /**
   * Cierra la caja: guarda la foto del resumen, la diferencia entre lo contado
   * y lo esperado, y le manda el cierre al dueño por correo.
   */
  async cerrar(ownerId: string, datos: { efectivoContado: number; notas?: string }, por: string) {
    const turno = await this.abierta(ownerId);
    if (!turno) throw new BadRequestException('No hay una caja abierta');

    const ahora = new Date();
    const resumen = await this.resumen(turno, ahora);
    turno.cerradaEn = ahora;
    turno.cerradaPor = por;
    turno.efectivoContado = datos.efectivoContado;
    turno.notas = datos.notas?.trim() || undefined;
    turno.cierre = { ...resumen, diferencia: datos.efectivoContado - resumen.efectivoEsperado };
    await turno.save();
    this.logger.log(`Caja cerrada por ${por}: esperado ${resumen.efectivoEsperado}, contado ${datos.efectivoContado}`);

    /* El correo no puede tumbar el cierre: la caja ya quedó cerrada. */
    try {
      const [dueno, club] = await Promise.all([
        this.userModel.findById(turno.ownerId).select('email name').lean(),
        this.clubModel.findOne({ ownerUserId: turno.ownerId }).select('name').lean(),
      ]);
      if (dueno?.email) {
        await this.notifications.sendCierreCaja({
          email: dueno.email,
          club: club?.name ?? 'tu club',
          turno: turno.toObject() as any,
        });
      }
    } catch (e) {
      this.logger.error(`No se pudo enviar el cierre de caja: ${e.message}`);
    }

    return turno.toObject();
  }

  /** Los últimos cierres, para el historial del dueño. */
  historial(ownerId: string, limite = 30) {
    return this.turnoModel
      .find({ ownerId: new Types.ObjectId(ownerId), cerradaEn: { $exists: true } })
      .sort({ cerradaEn: -1 })
      .limit(Math.max(1, Math.min(100, limite)))
      .lean();
  }

  async detalle(ownerId: string, id: string) {
    const turno = await this.turnoModel
      .findOne({ _id: aObjectId(id, 'Cierre no encontrado'), ownerId: new Types.ObjectId(ownerId) })
      .lean();
    if (!turno) throw new NotFoundException('Cierre no encontrado');
    return turno;
  }
}
