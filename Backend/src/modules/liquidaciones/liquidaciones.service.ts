import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';

import { Booking, BookingDocument, BookingStatus } from '../bookings/schemas/booking.schema';
import { Club, ClubDocument } from '../clubs/schemas/club.schema';
import { Liquidacion, LiquidacionDocument, LiquidacionEstado } from './schemas/liquidacion.schema';
import {
  etiquetaPeriodo,
  periodoActual,
  periodoAnterior,
  periodoDe,
  periodosCerrados,
  type Periodo,
} from './periodo.util';

/** Fila de la tabla de liquidación: lo que hay que girarle a un club. */
export interface FilaLiquidacion {
  ownerId: string;
  clubNombre: string;
  reservas: number;
  bruto: number;
  comision: number;
  neto: number;
  estado: LiquidacionEstado;
  giradaAt?: Date;
  referencia?: string;
  /** Datos para hacer la transferencia */
  banco?: Club['banco'];
}

@Injectable()
export class LiquidacionesService {
  constructor(
    @InjectModel(Booking.name)     private bookingModel:     Model<BookingDocument>,
    @InjectModel(Club.name)        private clubModel:        Model<ClubDocument>,
    @InjectModel(Liquidacion.name) private liquidacionModel: Model<LiquidacionDocument>,
    private readonly config: ConfigService,
  ) {}

  /** Comisión de la plataforma. Vive en el entorno por si cambia la tarifa. */
  get comisionPorcentaje(): number {
    const raw = Number(this.config.get('COMISION_PORCENTAJE'));
    return Number.isFinite(raw) && raw >= 0 && raw <= 100 ? raw : 9;
  }

  private comisionDe(bruto: number): number {
    return Math.round((bruto * this.comisionPorcentaje) / 100);
  }

  /**
   * Suma por club lo cobrado en un periodo.
   *
   * Solo entran las reservas que siguen en pie: una cancelada nunca llega a
   * liquidarse, que es la razón por la que la comisión no se calcula al
   * momento del pago sino en el corte.
   */
  private async agregarPorClub(periodo: Periodo) {
    return this.bookingModel.aggregate<{
      _id: Types.ObjectId;
      reservas: number;
      bruto: number;
      bookingIds: Types.ObjectId[];
    }>([
      {
        $match: {
          date: { $gte: periodo.inicio, $lt: periodo.fin },
          status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
          paymentMethod: 'wompi',
        },
      },
      { $lookup: { from: 'courts', localField: 'courtId', foreignField: '_id', as: 'court' } },
      { $unwind: '$court' },
      {
        $group: {
          _id: '$court.ownerId',
          reservas: { $sum: 1 },
          bruto: { $sum: '$totalPrice' },
          bookingIds: { $push: '$_id' },
        },
      },
      { $sort: { bruto: -1 } },
    ]);
  }

  /** Estado de un periodo: qué se le debe a cada club y qué ya se giró. */
  async resumen(inicio?: string) {
    const periodo = inicio ? periodoDe(new Date(inicio)) : periodoAnterior();
    const enCurso = periodo.inicio.getTime() === periodoActual().inicio.getTime();

    const [agregado, giradas, clubes] = await Promise.all([
      this.agregarPorClub(periodo),
      this.liquidacionModel.find({ periodoInicio: periodo.inicio }).lean(),
      this.clubModel.find().select('ownerUserId name banco').lean(),
    ]);

    const clubPorOwner = new Map(clubes.map((c) => [c.ownerUserId.toString(), c]));
    const giradaPorOwner = new Map(giradas.map((g) => [g.ownerId.toString(), g]));

    const filas: FilaLiquidacion[] = agregado.map((fila) => {
      const ownerId = fila._id.toString();
      const club = clubPorOwner.get(ownerId);
      const girada = giradaPorOwner.get(ownerId);

      // Si ya se giró, mandan los números congelados en la liquidación
      const bruto    = girada?.bruto    ?? fila.bruto;
      const comision = girada?.comision ?? this.comisionDe(fila.bruto);

      return {
        ownerId,
        clubNombre: club?.name ?? girada?.clubNombre ?? 'Club sin nombre',
        reservas:   girada?.reservas ?? fila.reservas,
        bruto,
        comision,
        neto:       girada?.neto ?? bruto - comision,
        estado:     girada?.estado ?? LiquidacionEstado.PENDIENTE,
        giradaAt:   girada?.giradaAt,
        referencia: girada?.referencia,
        banco:      club?.banco,
      };
    });

    const suma = (campo: keyof FilaLiquidacion) =>
      filas.reduce((acc, f) => acc + (Number(f[campo]) || 0), 0);

    return {
      periodo: {
        inicio: periodo.inicio,
        fin: periodo.fin,
        giro: periodo.giro,
        etiqueta: etiquetaPeriodo(periodo),
        enCurso,
      },
      comisionPorcentaje: this.comisionPorcentaje,
      clubes: filas,
      totales: {
        clubes: filas.length,
        reservas: suma('reservas'),
        bruto: suma('bruto'),
        comision: suma('comision'),
        neto: suma('neto'),
        pendiente: filas
          .filter((f) => f.estado === LiquidacionEstado.PENDIENTE)
          .reduce((acc, f) => acc + f.neto, 0),
      },
    };
  }

  /** Periodos recientes para el selector de semana del panel. */
  async periodos(cantidad = 8) {
    const lista = [periodoActual(), ...periodosCerrados(cantidad)];
    const actual = periodoActual().inicio.getTime();

    const giradas = await this.liquidacionModel
      .find({ periodoInicio: { $in: lista.map((p) => p.inicio) }, estado: LiquidacionEstado.GIRADA })
      .select('periodoInicio')
      .lean();

    const giradasPorInicio = new Set(giradas.map((g) => g.periodoInicio.getTime()));

    return lista.map((p) => ({
      inicio: p.inicio,
      fin: p.fin,
      giro: p.giro,
      etiqueta: etiquetaPeriodo(p),
      enCurso: p.inicio.getTime() === actual,
      tieneGiros: giradasPorInicio.has(p.inicio.getTime()),
    }));
  }

  /**
   * Marca como girada la liquidación de un club. Congela los montos: si más
   * adelante se toca una reserva de esa semana, el historial no se mueve.
   */
  async girar(ownerId: string, inicio: string, referencia?: string) {
    const periodo = periodoDe(new Date(inicio));
    const agregado = await this.agregarPorClub(periodo);
    const fila = agregado.find((f) => f._id.toString() === ownerId);

    if (!fila) {
      throw new NotFoundException('Ese club no tiene reservas para liquidar en esa semana');
    }

    const club = await this.clubModel.findOne({ ownerUserId: new Types.ObjectId(ownerId) }).lean();
    const comision = this.comisionDe(fila.bruto);

    return this.liquidacionModel.findOneAndUpdate(
      { ownerId: new Types.ObjectId(ownerId), periodoInicio: periodo.inicio },
      {
        $set: {
          ownerId: new Types.ObjectId(ownerId),
          clubNombre: club?.name,
          periodoInicio: periodo.inicio,
          periodoFin: periodo.fin,
          reservas: fila.reservas,
          bruto: fila.bruto,
          comisionPorcentaje: this.comisionPorcentaje,
          comision,
          neto: fila.bruto - comision,
          estado: LiquidacionEstado.GIRADA,
          giradaAt: new Date(),
          referencia,
          bookingIds: fila.bookingIds,
        },
      },
      { upsert: true, new: true },
    );
  }

  /** Deshace un giro marcado por error. */
  async revertir(ownerId: string, inicio: string) {
    const periodo = periodoDe(new Date(inicio));
    const borrada = await this.liquidacionModel.findOneAndDelete({
      ownerId: new Types.ObjectId(ownerId),
      periodoInicio: periodo.inicio,
    });
    if (!borrada) throw new NotFoundException('No hay un giro registrado para esa semana');
    return { message: 'Giro revertido' };
  }

  /**
   * Lo que ve el dueño del club: sus semanas, con la que está corriendo de
   * primera para que sepa cuánto lleva acumulado.
   */
  async misLiquidaciones(ownerId: string, cantidad = 8) {
    const lista = [periodoActual(), ...periodosCerrados(cantidad)];

    const [giradas, semanas] = await Promise.all([
      this.liquidacionModel
        .find({ ownerId: new Types.ObjectId(ownerId), periodoInicio: { $in: lista.map((p) => p.inicio) } })
        .lean(),
      Promise.all(lista.map(async (p) => ({ periodo: p, agregado: await this.agregarPorClub(p) }))),
    ]);

    const giradaPorInicio = new Map(giradas.map((g) => [g.periodoInicio.getTime(), g]));

    return {
      comisionPorcentaje: this.comisionPorcentaje,
      semanas: semanas.map(({ periodo, agregado }) => {
        const fila = agregado.find((f) => f._id.toString() === ownerId);
        const girada = giradaPorInicio.get(periodo.inicio.getTime());
        const bruto = girada?.bruto ?? fila?.bruto ?? 0;
        const comision = girada?.comision ?? this.comisionDe(bruto);

        return {
          etiqueta: etiquetaPeriodo(periodo),
          inicio: periodo.inicio,
          fin: periodo.fin,
          giro: periodo.giro,
          enCurso: periodo.inicio.getTime() === periodoActual().inicio.getTime(),
          reservas: girada?.reservas ?? fila?.reservas ?? 0,
          bruto,
          comision,
          neto: girada?.neto ?? bruto - comision,
          estado: girada?.estado ?? LiquidacionEstado.PENDIENTE,
          giradaAt: girada?.giradaAt,
          referencia: girada?.referencia,
        };
      }),
    };
  }
}
