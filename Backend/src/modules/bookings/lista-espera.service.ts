import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ListaEspera, ListaEsperaDocument } from './schemas/lista-espera.schema';
import { ListaEsperaDto } from './dto/lista-espera.dto';
import { Booking, BookingDocument, BookingStatus } from './schemas/booking.schema';
import { Court, CourtDocument } from '../courts/schemas/court.schema';
import { BlockedSlot, BlockedSlotDocument } from '../courts/schemas/blocked-slot.schema';
import { NotificationsService, toAmPm } from '../notifications/notifications.service';
import { PushService } from '../notifications/push.service';

const aMinutos = (hhmm: string) => {
  const [h, m] = String(hhmm ?? '0:0').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** Medianoche local del día, igual que se guarda en las reservas. */
const diaLocal = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const ACTIVAS = [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.REAGENDADA];

/** Cuántos turnos puede estar esperando a la vez un mismo correo. */
const MAX_POR_CORREO = 10;

/**
 * Lista de espera de turnos ocupados.
 *
 * En vez de enganchar un aviso en cada lugar donde se libera un horario (pago
 * rechazado, reserva vencida, reprogramación, bloqueo borrado, reserva del
 * club anulada...), un cron revisa cada pocos minutos si los turnos esperados
 * quedaron libres. Así ningún camino nuevo se queda sin avisar.
 */
@Injectable()
export class ListaEsperaService {
  private readonly logger = new Logger(ListaEsperaService.name);

  constructor(
    @InjectModel(ListaEspera.name) private readonly listaModel: Model<ListaEsperaDocument>,
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Court.name) private readonly courtModel: Model<CourtDocument>,
    @InjectModel(BlockedSlot.name) private readonly blockedSlotModel: Model<BlockedSlotDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly push: PushService,
  ) {}

  /** Rangos [inicio, fin) en minutos que están tomados ese día en la cancha. */
  private async ocupados(courtId: Types.ObjectId, fecha: string): Promise<[number, number][]> {
    const dia = diaLocal(fecha);
    const rango = {
      $gte: new Date(new Date(dia).setHours(0, 0, 0, 0)),
      $lt: new Date(new Date(dia).setHours(23, 59, 59, 999)),
    };
    const [reservas, bloqueos] = await Promise.all([
      this.bookingModel.find({ courtId, date: rango, status: { $in: ACTIVAS } }).select('startTime endTime').lean(),
      this.blockedSlotModel.find({ courtId, date: rango }).select('startTime endTime').lean(),
    ]);
    return [...reservas, ...bloqueos].map((o: any) => [aMinutos(o.startTime), aMinutos(o.endTime)]);
  }

  private static seCruza(tomados: [number, number][], ini: number, fin: number) {
    return tomados.some(([a, b]) => ini < b && fin > a);
  }

  async unirse(dto: ListaEsperaDto) {
    const ini = aMinutos(dto.startTime);
    const fin = aMinutos(dto.endTime);
    if (fin <= ini) throw new BadRequestException('La hora de fin debe ser posterior a la de inicio');

    const courtId = new Types.ObjectId(dto.courtId);
    const cancha = await this.courtModel.findById(courtId).select('isActive').lean();
    if (!cancha || cancha.isActive === false) throw new NotFoundException('Cancha no encontrada');

    const inicio = diaLocal(dto.date);
    inicio.setHours(Math.floor(ini / 60), ini % 60, 0, 0);
    if (inicio.getTime() <= Date.now()) throw new BadRequestException('Ese turno ya pasó');

    const tomados = await this.ocupados(courtId, dto.date);
    if (!ListaEsperaService.seCruza(tomados, ini, fin)) {
      throw new BadRequestException('Ese turno está libre: puedes reservarlo ahora');
    }

    const email = dto.email.toLowerCase().trim();
    const activas = await this.listaModel.countDocuments({ email, avisado: false });
    if (activas >= MAX_POR_CORREO) {
      throw new BadRequestException(`Ya estás esperando ${MAX_POR_CORREO} turnos. Espera a que se liberen o pasen.`);
    }

    const expira = diaLocal(dto.date);
    expira.setHours(23, 59, 59, 999);

    await this.listaModel.updateOne(
      { courtId, fecha: dto.date, startTime: dto.startTime, email },
      {
        $set: {
          endTime: dto.endTime,
          nombre: dto.nombre,
          pushToken: dto.pushToken,
          avisado: false,
          expira,
        },
      },
      { upsert: true },
    );

    const enEspera = await this.listaModel.countDocuments({
      courtId, fecha: dto.date, startTime: dto.startTime, avisado: false,
    });
    return { ok: true, enEspera };
  }

  /** Cada 5 minutos: ¿se liberó alguno de los turnos que alguien espera? */
  @Cron('*/5 * * * *')
  async revisar() {
    const hoy = new Date();
    const ymdHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

    const pendientes = await this.listaModel
      .find({ avisado: false, fecha: { $gte: ymdHoy } })
      .select('+pushToken')
      .limit(2000)
      .lean();
    if (!pendientes.length) return;

    const grupos = new Map<string, typeof pendientes>();
    for (const p of pendientes) {
      const k = `${p.courtId}|${p.fecha}`;
      if (!grupos.has(k)) grupos.set(k, []);
      grupos.get(k)!.push(p);
    }

    let avisados = 0;
    for (const entradas of grupos.values()) {
      const { courtId, fecha } = entradas[0];
      const tomados = await this.ocupados(courtId as Types.ObjectId, fecha);

      for (const e of entradas) {
        const ini = aMinutos(e.startTime);
        const fin = aMinutos(e.endTime);
        if (ListaEsperaService.seCruza(tomados, ini, fin)) continue;

        const inicio = diaLocal(fecha);
        inicio.setHours(Math.floor(ini / 60), ini % 60, 0, 0);
        /* Marcarla primero: si el correo tarda y el cron vuelve a correr, no
           se avisa dos veces. */
        await this.listaModel.updateOne({ _id: e._id }, { $set: { avisado: true } });
        if (inicio.getTime() <= Date.now()) continue;

        try {
          await this.notificationsService.sendTurnoLiberado({
            email: e.email,
            nombre: e.nombre,
            courtId: String(courtId),
            fecha,
            startTime: e.startTime,
            endTime: e.endTime,
          });
        } catch (err) {
          this.logger.error(`No se pudo avisar el turno liberado a ${e.email}: ${err.message}`);
        }
        await this.push.enviar([e.pushToken], {
          titulo: '¡Se liberó el turno que esperabas!',
          cuerpo: `${fecha} a las ${toAmPm(e.startTime)}. El primero que lo pague se lo queda.`,
          datos: { tipo: 'turno-liberado', courtId: String(courtId), fecha, startTime: e.startTime },
        });
        avisados++;
      }
    }
    if (avisados) this.logger.log(`Lista de espera: ${avisados} avisos de turno liberado`);
  }
}
