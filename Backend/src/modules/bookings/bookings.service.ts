import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Booking, BookingDocument, BookingOrigen, BookingStatus } from './schemas/booking.schema';
import { ReservaManualDto } from './dto/reserva-manual.dto';
import { PushService } from '../notifications/push.service';
import { formatDateCO, toAmPm } from '../notifications/notifications.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { EpaycoService } from '../epayco/epayco.service';
import { CobrosService } from '../cobros/cobros.service';
import { Club, ClubDocument } from '../clubs/schemas/club.schema';
import { Court, CourtDocument } from '../courts/schemas/court.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { BlockedSlot, BlockedSlotDocument } from '../courts/schemas/blocked-slot.schema';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { generarCodigoReserva } from '../../common/utils/random.util';
import { escaparRegex } from '../../common/utils/regex.util';
import { aObjectId } from '../../common/utils/objectid.util';

/**
 * Cuántas horas antes del turno se puede mover o soltar una reserva.
 * Es el margen que le queda al club para revender el horario.
 */
const REPROGRAMAR_HORAS = 24;

const aMinutos = (hhmm: string) => {
  const [h, m] = String(hhmm ?? '0:0').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
const aHora = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Club.name) private clubModel: Model<ClubDocument>,
    @InjectModel(Court.name) private courtModel: Model<CourtDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(BlockedSlot.name) private blockedSlotModel: Model<BlockedSlotDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly epaycoService: EpaycoService,
    private readonly cobrosService: CobrosService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly push: PushService,
  ) {}

  // --- MÉTODOS PARA EL WEBHOOK ---

  /**
   * Busca una reserva por su código único (la factura que viaja a ePayco)
   */
  async findByCode(code: string): Promise<BookingDocument | null> {
    return this.bookingModel.findOne({ bookingCode: code }).populate('courtId').exec();
  }

  /**
   * Actualiza el estado y, si viene del cobro, las referencias de ePayco
   */
  async updateStatus(
    id: string,
    updateData: {
      status: string;
      epaycoRefPayco?: string;
      epaycoTransactionId?: string;
    },
    userId?: string,
    userRole?: string,
  ): Promise<Omit<Booking, 'cancelToken' | 'reviewToken'>> {
    const { status, epaycoRefPayco, epaycoTransactionId } = updateData;

    const validStatuses = ['confirmed', 'reagendada', 'completed'];
    if (!validStatuses.includes(status))
      throw new BadRequestException('Estado inválido');

    // Validar ownership: solo el owner de la cancha o un admin puede cambiar el estado
    if (userId && userRole !== 'admin') {
      const booking = await this.bookingModel.findById(id).populate('courtId', 'ownerId');
      if (!booking) throw new NotFoundException('Reserva no encontrada');
      const court = booking.courtId as any;
      if (court?.ownerId?.toString() !== userId) {
        throw new ForbiddenException('No tienes permiso para modificar esta reserva');
      }
      /* El club solo puede dar por jugado un turno ya pagado. Confirmar le
         toca a ePayco: si el club pudiera hacerlo, una reserva sin pagar le
         llegaría al jugador como confirmada. */
      if (status !== 'completed' || !['confirmed', 'reagendada'].includes(booking.status)) {
        throw new BadRequestException('Solo puedes marcar como completada una reserva ya pagada');
      }
    }

    const updatePayload: any = { status };
    if (epaycoRefPayco) updatePayload.epaycoRefPayco = epaycoRefPayco;
    if (epaycoTransactionId) updatePayload.epaycoTransactionId = epaycoTransactionId;

    /* Un turno fijo se paga en un solo cobro: al confirmarse la primera fecha
       se confirman también las demás que seguían pendientes. */
    let serie: BookingDocument[] = [];
    if (status === 'confirmed') {
      const actual = await this.bookingModel.findById(id).select('serieId status');
      if (actual?.serieId && actual.status === BookingStatus.PENDING) {
        serie = await this.cobroDe(actual);
        await this.bookingModel.updateMany(
          { _id: { $in: serie.map((b) => b._id) } },
          { $set: updatePayload },
        );
      }
    }

    const updated = await this.bookingModel.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true }
    ).select('+cancelToken +reviewToken +pushToken').populate('courtId', 'name sport ownerId');

    if (!updated) throw new NotFoundException('Reserva no encontrada');

    // Notificaciones automáticas según cambio de estado
    if (status === 'confirmed') {
      const resumen = serie.length > 1
        ? {
            fechas: serie.map((b) => b.date),
            total: serie.reduce((acc, b) => acc + b.totalPrice, 0),
            netoTotal: serie.reduce((acc, b) => acc + (b.netoDueno ?? 0), 0),
          }
        : undefined;
      await this.notificationsService.sendBookingConfirmation(updated as any, resumen);
      await this.push.enviar([updated.pushToken], {
        titulo: '¡Reserva confirmada!',
        cuerpo: `${(updated.courtId as any)?.name ?? 'Tu cancha'} · ${formatDateCO(updated.date)}, ${toAmPm(updated.startTime)}${resumen ? ` (y ${resumen.fechas.length - 1} semanas más)` : ''}`,
        datos: { tipo: 'reserva-confirmada', bookingCode: updated.bookingCode },
      });
      /* Sin userId la confirmación viene de ePayco: es el momento en que la
         reserva existe de verdad para el club. Si la confirma el propio dueño
         desde el panel, no tiene sentido avisarle de lo que acaba de hacer. */
      if (!userId) await this.avisarDueno(updated, resumen);
    }

    if (status === 'completed') {
      await this.notificationsService.sendReviewRequest(updated as any);
    }

    /* Los tokens se pidieron para armar los enlaces de esos correos, no para
       devolverlos: esta respuesta la recibe el panel del club, y con el
       cancelToken el club podria mover la reserva de su cliente. */
    return this.sinTokens(updated);
  }

  // --- LÓGICA DE PAGOS ---

  /**
   * Abre el cobro en ePayco y devuelve lo mínimo que el navegador necesita.
   *
   * Nunca se devuelve el monto para que el cliente lo mande de vuelta: la
   * sesión ya viene cerrada desde el servidor con el total de la reserva.
   */
  async initPayment(bookingId: string, redirectUrl: string, ip?: string) {
    const booking = await this.bookingModel
      .findById(bookingId)
      .populate('courtId');

    if (!booking) throw new NotFoundException('Reserva no encontrada');

    /* Sin llaves de ePayco no hay checkout: mejor fallar acá que dejar al
       jugador frente a una pasarela que no abre. */
    if (!this.epaycoService.configured) {
      throw new BadRequestException('Los pagos en línea no están disponibles en este momento');
    }

    const cancha = booking.courtId as any;

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Esta reserva ya está pagada');
    }

    /* Un turno fijo se paga entero en un solo cobro, con el código de la
       primera fecha como factura. */
    const cobro = await this.cobroDe(booking);
    const sumar = (campo: 'totalPrice' | 'netoDueno' | 'gananciaPlataforma' | 'costoPasarela') =>
      cobro.reduce((acc, b) => acc + (b[campo] ?? 0), 0);
    const montos = {
      totalPrice: sumar('totalPrice'),
      netoDueno: sumar('netoDueno'),
      gananciaPlataforma: sumar('gananciaPlataforma'),
      costoPasarela: sumar('costoPasarela'),
    };
    const semanas = cobro.length;

    /* Base pública de la API, con el prefijo /api incluido: no hay subdominio
       propio para el backend, nginx enruta /api/ del mismo dominio al 4000, y
       la app monta todo bajo setGlobalPrefix('api'). Si esta URL queda mal,
       ePayco no puede avisar el resultado y la reserva nunca se confirma. */
    const backend = (process.env.BACKEND_URL ?? 'https://reservatucancha.site/api').replace(/\/+$/, '');

    /* Con pagos divididos la plata no pasa por la empresa: ePayco le consigna
       al club en el mismo cobro, así que hace falta su id de receptor. */
    const split = await this.resolverSplit(booking, cancha, montos);

    const sessionId = await this.epaycoService.crearSesion({
      total: montos.totalPrice,
      invoice: booking.bookingCode,
      nombre: semanas > 1
        ? `Turno fijo ${cancha?.name ?? 'de cancha'}`
        : `Reserva ${cancha?.name ?? 'de cancha'}`,
      descripcion: semanas > 1
        ? `${semanas} semanas · ${booking.startTime}–${booking.endTime} · código ${booking.bookingCode}`
        : `${booking.startTime}–${booking.endTime} · código ${booking.bookingCode}`,
      responseUrl: this.resolverRedirect(bookingId, redirectUrl),
      confirmationUrl: `${backend}/webhooks/epayco`,
      cliente: {
        nombre: booking.guestName,
        email: booking.guestEmail,
        telefono: booking.guestPhone,
      },
      ip,
      split,
    });

    /* La app no puede cargar el checkout (es un script de navegador): abre en
       el navegador del teléfono la página /pagar de la web, que lo abre con
       esta misma sesión. `redirectUrl` repite el link para las versiones de
       la app que todavía lo leen con ese nombre, de cuando se pagaba con
       Wompi. */
    const frontend = (process.env.FRONTEND_URL ?? 'https://reservatucancha.site').replace(/\/+$/, '');
    const checkoutUrl =
      `${frontend}/pagar?session=${encodeURIComponent(sessionId)}${this.epaycoService.testMode ? '&test=1' : ''}`;

    return {
      sessionId,
      publicKey: this.epaycoService.publicKey,
      test: this.epaycoService.testMode,
      checkoutUrl,
      redirectUrl: checkoutUrl,
    };
  }

  /**
   * Quién recibe qué en este cobro.
   *
   * Si el split no está activo devuelve undefined y el cobro entra entero a la
   * cuenta de la empresa. Si está activo pero el club no tiene su cuenta de
   * ePayco lista, se corta acá: cobrarle al jugador sin tener a dónde girarle
   * al club dejaría la plata represada y la reserva en pie.
   */
  private async resolverSplit(
    booking: BookingDocument,
    cancha: any,
    montos: { netoDueno: number; gananciaPlataforma: number; costoPasarela: number },
  ) {
    if (!this.epaycoService.splitActivo) return undefined;

    const club = await this.clubModel
      .findOne({ ownerUserId: cancha?.ownerId })
      .select('epaycoReceptorId name')
      .lean();

    if (!club?.epaycoReceptorId) {
      this.logger.error(
        `El club de la cancha ${cancha?._id} no tiene cuenta de ePayco: no se puede cobrar ${booking.bookingCode}`,
      );
      throw new BadRequestException(
        'Esta cancha todavía no puede recibir pagos en línea. Escríbele al club para reservar.',
      );
    }

    /* Los montos salen congelados de la reserva, no se recalculan: así lo que
       reparte ePayco es exactamente lo que se le mostró al jugador. */
    return {
      receptorId: club.epaycoReceptorId,
      netoDueno: montos.netoDueno,
      gananciaPlataforma: montos.gananciaPlataforma,
      costoPasarela: montos.costoPasarela,
      brutoPlataforma: this.cobrosService.brutoPlataformaSplit(montos.gananciaPlataforma),
    };
  }

  /**
   * A donde vuelve el navegador cuando termina de pagar.
   *
   * El destino lo propone el cliente, asi que se acepta solo si apunta a un
   * origen nuestro o al esquema de la app. Sin este filtro nuestro propio
   * enlace de pago, firmado y legitimo, terminaba mandando a donde quisiera
   * el que armo la reserva.
   */
  private resolverRedirect(bookingId: string, propuesta?: string): string {
    const frontend = process.env.FRONTEND_URL ?? 'https://reservatucancha.site';
    const pordefecto = `${frontend.replace(/\/+$/, '')}/reservas/confirmacion?bookingId=${bookingId}`;
    if (!propuesta) return pordefecto;

    let url: URL;
    try {
      url = new URL(propuesta);
    } catch {
      return pordefecto;
    }

    /* La app movil vuelve por su propio esquema; el navegador, por el sitio. */
    if (url.protocol === 'reservatucancha:') return propuesta;

    const permitidos = new Set<string>();
    try { permitidos.add(new URL(frontend).origin); } catch { /* env mal puesta */ }
    permitidos.add('https://www.reservatucancha.site'); // el CORS ya lo acepta
    permitidos.add('http://localhost:3000');
    if (permitidos.has(url.origin)) return propuesta;

    this.logger.warn(`Redirect de pago rechazado: ${url.origin}`);
    return pordefecto;
  }

  // --- GESTIÓN DE RESERVAS ---

  /**
   * Fechas de la reserva: una sola, o la misma hora durante `semanas` semanas
   * seguidas para un turno fijo.
   */
  private static fechasSemanales(ymd: string, semanas: number): Date[] {
    const [year, month, day] = ymd.split('-').map(Number);
    return Array.from({ length: semanas }, (_, i) => new Date(year, month - 1, day + 7 * i));
  }

  private static ymd(fecha: Date): string {
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
  }

  /** Hoy y la hora actual en Colombia, para no reservar en el pasado. */
  private static ahoraColombia() {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const p = Object.fromEntries(fmt.formatToParts(new Date()).map((x) => [x.type, x.value]));
    return { hoy: `${p.year}-${p.month}-${p.day}`, minutos: Number(p.hour) * 60 + Number(p.minute) };
  }

  /**
   * Valida un turno y devuelve las fechas en que se puede reservar.
   *
   * Si alguna fecha de una reserva fija choca, se rechaza todo y se dice
   * cuáles: reservar solo una parte de la serie confundiría al jugador.
   */
  private async validarTurno(
    courtId: Types.ObjectId,
    fechaYmd: string,
    startTime: string,
    endTime: string,
    semanas: number,
  ): Promise<{ fechas: Date[]; duracionMins: number }> {
    const ini = aMinutos(startTime);
    const fin = aMinutos(endTime);
    const duracionMins = fin - ini;
    if (duracionMins <= 0) {
      throw new BadRequestException('La hora de fin debe ser posterior a la de inicio');
    }

    const ymd = String(fechaYmd).slice(0, 10);
    const { hoy, minutos } = BookingsService.ahoraColombia();
    if (ymd < hoy) throw new BadRequestException('No puedes reservar una fecha que ya pasó');
    if (ymd === hoy && ini <= minutos) throw new BadRequestException('No puedes reservar un horario que ya pasó');

    const fechas = BookingsService.fechasSemanales(ymd, semanas);
    if (semanas === 1) {
      await this.assertSlotLibre(courtId, fechas[0], ini, fin);
      return { fechas, duracionMins };
    }

    const chocan: string[] = [];
    for (const fecha of fechas) {
      try {
        await this.assertSlotLibre(courtId, fecha, ini, fin);
      } catch (e) {
        if (!(e instanceof ConflictException)) throw e;
        chocan.push(fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }));
      }
    }
    if (chocan.length) {
      throw new ConflictException(
        `El turno fijo no se puede reservar: ${chocan.length === 1 ? 'esta fecha ya está ocupada' : 'estas fechas ya están ocupadas'}: ${chocan.join(', ')}`,
      );
    }
    return { fechas, duracionMins };
  }

  private async codigoUnico(): Promise<string> {
    for (;;) {
      const bookingCode = generarCodigoReserva(8);
      if (!(await this.bookingModel.exists({ bookingCode }))) return bookingCode;
    }
  }

  async create(createBookingDto: CreateBookingDto): Promise<Booking & { serie?: any }> {
    const courtId = typeof createBookingDto.courtId === 'string'
      ? new Types.ObjectId(createBookingDto.courtId)
      : createBookingDto.courtId;

    /* La cancha manda el precio. Antes el total venia en el body y cualquiera
       podia crear la reserva por un peso y pagar eso en el checkout. */
    const cancha = await this.courtModel.findById(courtId).lean();
    if (!cancha || cancha.isActive === false) {
      throw new NotFoundException('Cancha no encontrada');
    }

    const semanas = Math.max(1, Math.min(12, createBookingDto.semanas ?? 1));
    const { fechas, duracionMins } = await this.validarTurno(
      courtId,
      createBookingDto.date,
      createBookingDto.startTime,
      createBookingDto.endTime,
      semanas,
    );

    /* El precio de lista es por hora; la tarifa de servicio es una sola por
       reserva, no por hora, así que se suma después de prorratear el turno.
       En un turno fijo cada fecha lleva su tarifa, y la pasarela, que cobra
       una sola vez, se reparte entre todas (ver CobrosService.desglosarSerie). */
    const precioCancha = Math.round((cancha.pricePerHour * duracionMins) / 60);
    const desgloses = this.cobrosService.desglosarSerie(fechas.map(() => precioCancha));
    const serieId = semanas > 1 ? uuidv4() : undefined;

    const { semanas: _s, totalPrice: _t, paymentMethod: _p, ...datos } = createBookingDto;

    const guardadas: BookingDocument[] = [];
    for (let i = 0; i < fechas.length; i++) {
      const desglose = desgloses[i];
      const booking = new this.bookingModel({
        ...datos,
        courtId,
        /* Congelado al crear: la liquidación suma estos campos tal cual, para
           que un cambio de tarifa no reescriba lo que ya se cobró. */
        precioCancha:       desglose.precioCancha,
        tarifaServicio:     desglose.tarifaServicio,
        totalPrice:         desglose.totalPagado,
        costoPasarela:      desglose.costoPasarela,
        gananciaPlataforma: desglose.gananciaPlataforma,
        netoDueno:          desglose.netoDueno,
        paymentMethod: 'epayco',
        origen: BookingOrigen.ONLINE,
        date: fechas[i],
        cancelToken: uuidv4(),
        reviewToken: uuidv4(),
        bookingCode: await this.codigoUnico(),
        status: BookingStatus.PENDING,
        ...(serieId ? { serieId, serieOrden: i + 1 } : {}),
      });
      guardadas.push(await booking.save());
    }

    const primera = guardadas[0];
    this.logger.log(
      `Reserva creada: ${primera.bookingCode}${serieId ? ` (turno fijo de ${semanas} semanas)` : ''}`,
    );

    /* Al dueño no se le avisa todavía: la reserva nace pendiente y, si el pago
       no pasa, se borra. Se le avisa cuando ePayco confirma (updateStatus). */
    const respuesta: any = this.sinTokens(primera);
    delete respuesta.pushToken;
    if (serieId) {
      respuesta.serie = {
        id: serieId,
        semanas,
        fechas: fechas.map(BookingsService.ymd),
        total: guardadas.reduce((acc, b) => acc + b.totalPrice, 0),
      };
    }
    return respuesta;
  }

  /**
   * Las reservas que se cobran juntas con esta: ella sola, o todas las de su
   * turno fijo que siguen pendientes de pago.
   */
  async cobroDe(booking: BookingDocument | any): Promise<BookingDocument[]> {
    if (!booking?.serieId) return [booking];
    const serie = await this.bookingModel
      .find({ serieId: booking.serieId, status: BookingStatus.PENDING })
      .sort({ serieOrden: 1 });
    return serie.length ? serie : [booking];
  }

  /** Lo que tiene que llegar en la confirmación de ePayco para este cobro. */
  async totalACobrar(booking: BookingDocument | any): Promise<number> {
    const cobro = await this.cobroDe(booking);
    return cobro.reduce((acc, b) => acc + (b.totalPrice ?? 0), 0);
  }

  // --- RESERVAS QUE ANOTA EL CLUB ---

  /**
   * El club anota una reserva tomada por teléfono o en el mostrador para que
   * ocupe el horario y nadie más la pague en línea. Se cobra en el club: no
   * lleva tarifa, pasarela ni ganancia, y queda confirmada de una.
   */
  async crearManual(ownerId: string, dto: ReservaManualDto) {
    const courtId = aObjectId(dto.courtId, 'Cancha no encontrada');
    const cancha = await this.courtModel.findById(courtId).lean();
    if (!cancha) throw new NotFoundException('Cancha no encontrada');
    if (String(cancha.ownerId) !== String(ownerId)) {
      throw new ForbiddenException('Esta cancha no es de tu club');
    }

    const semanas = Math.max(1, Math.min(26, dto.semanas ?? 1));
    const { fechas, duracionMins } = await this.validarTurno(courtId, dto.date, dto.startTime, dto.endTime, semanas);
    const precio = dto.precio ?? Math.round((cancha.pricePerHour * duracionMins) / 60);
    const serieId = semanas > 1 ? uuidv4() : undefined;

    const creadas = [];
    for (let i = 0; i < fechas.length; i++) {
      const b = await new this.bookingModel({
        courtId,
        guestName: dto.guestName,
        guestPhone: dto.guestPhone,
        guestEmail: dto.guestEmail,
        notes: dto.notes,
        date: fechas[i],
        startTime: dto.startTime,
        endTime: dto.endTime,
        origen: BookingOrigen.MANUAL,
        paymentMethod: 'club',
        status: BookingStatus.CONFIRMED,
        precioCancha: precio,
        totalPrice: precio,
        tarifaServicio: 0,
        costoPasarela: 0,
        gananciaPlataforma: 0,
        /* Lo que el club cobra en su caja es todo suyo. */
        netoDueno: precio,
        cancelToken: uuidv4(),
        reviewToken: uuidv4(),
        bookingCode: await this.codigoUnico(),
        ...(serieId ? { serieId, serieOrden: i + 1 } : {}),
      }).save();
      creadas.push(this.sinTokens(b));
    }

    this.logger.log(`El club anotó ${creadas.length} reserva(s) en ${cancha.name}`);
    return { creadas: creadas.length, reservas: creadas };
  }

  /**
   * Anula una reserva que anotó el club (o, con `serie`, esa y las siguientes
   * del mismo turno fijo). Las que se pagaron en línea no se anulan acá: esas
   * se mueven de horario, no se borran.
   */
  async anularManual(ownerId: string, bookingId: string, serie = false) {
    const booking = await this.bookingModel.findById(aObjectId(bookingId, 'Reserva no encontrada'))
      .populate('courtId', 'ownerId');
    if (!booking) throw new NotFoundException('Reserva no encontrada');
    if (String((booking.courtId as any)?.ownerId) !== String(ownerId)) {
      throw new ForbiddenException('No tienes permiso para modificar esta reserva');
    }
    if (booking.origen !== BookingOrigen.MANUAL) {
      throw new BadRequestException('Solo se pueden anular las reservas que anotó el club');
    }

    const filtro: any = serie && booking.serieId
      ? { serieId: booking.serieId, origen: BookingOrigen.MANUAL, date: { $gte: booking.date } }
      : { _id: booking._id };
    const { deletedCount } = await this.bookingModel.deleteMany(filtro);
    return { anuladas: deletedCount };
  }

  /** Ver `NotificationsService.sendPagoHuerfano`. */
  avisarPagoHuerfano(datos: Parameters<NotificationsService['sendPagoHuerfano']>[0]) {
    return this.notificationsService.sendPagoHuerfano(datos);
  }

  /**
   * Avisa al dueño de una reserva ya pagada: en el panel en tiempo real y por
   * correo. Nunca tumba la confirmación: si el aviso falla, el pago sigue
   * registrado y la reserva confirmada.
   */
  private async avisarDueno(booking: any, serie?: { fechas: Date[]; netoTotal: number }) {
    try {
      const court = booking.courtId;
      if (!court?.ownerId) return;
      const ownerId = court.ownerId.toString();

      this.notificationsGateway.notifyNewBooking(ownerId, booking.toObject?.() ?? booking);

      this.push.enviarAlClub(ownerId, {
        titulo: serie ? 'Nuevo turno fijo pagado' : 'Nueva reserva pagada',
        cuerpo: `${booking.guestName} · ${court.name ?? 'Cancha'} · ${formatDateCO(booking.date)}, ${toAmPm(booking.startTime)}${serie ? ` · ${serie.fechas.length} semanas` : ''}`,
        datos: { tipo: 'nueva-reserva', bookingId: String(booking._id) },
      }).catch((e) => this.logger.error(`Error push owner: ${e.message}`));

      const owner = await this.userModel.findById(ownerId).select('email').lean();
      if (owner?.email) {
        this.notificationsService.sendOwnerNewBookingNotification(booking, owner.email, serie).catch(
          (e) => this.logger.error(`Error email owner: ${e.message}`),
        );
      }
    } catch (e) {
      this.logger.error(`Error enviando notification al owner: ${e.message}`);
    }
  }

  /**
   * Campos que puede ver cualquiera que llegue a una reserva por su
   * identificador. Sin datos de contacto: un ObjectId lleva dentro el momento
   * en que se creo y un contador, asi que quien haga una reserva propia puede
   * tantear las vecinas. Lo que se muestre aca se muestra a quien adivine.
   */
  /**
   * Saca los tokens de una reserva antes de responder.
   *
   * La regla es absoluta a proposito: NINGUNA respuesta de la API lleva
   * cancelToken ni reviewToken, ni siquiera cuando quien pregunta ya los tiene.
   * Una regla sin excepciones se verifica con un grep; una con excepciones se
   * erosiona, y fue justo asi que la toma de reservas ajenas sobrevivio a dos
   * arreglos parciales.
   */
  private sinTokens(doc: any) {
    const plano = typeof doc?.toObject === 'function' ? doc.toObject() : { ...doc };
    delete plano.cancelToken;
    delete plano.reviewToken;
    return plano;
  }

  private static readonly CAMPOS_PUBLICOS =
    '_id courtId date startTime endTime status totalPrice precioCancha tarifaServicio bookingCode paymentMethod players origen serieId serieOrden createdAt';

  async findById(id: string): Promise<Booking & { serie?: any }> {
    const booking: any = await this.bookingModel
      .findById(id)
      .select(BookingsService.CAMPOS_PUBLICOS)
      .populate('courtId', 'name sport location pricePerHour')
      .lean();
    if (!booking) throw new NotFoundException('Reserva no encontrada');
    /* La pantalla de confirmación muestra el turno fijo completo. */
    if (booking.serieId) {
      const fechas = await this.bookingModel
        .find({ serieId: booking.serieId })
        .select('date totalPrice')
        .sort({ serieOrden: 1 })
        .lean();
      booking.serie = {
        semanas: fechas.length,
        fechas: fechas.map((f) => BookingsService.ymd(new Date(f.date))),
        total: fechas.reduce((acc, f) => acc + (f.totalPrice ?? 0), 0),
      };
    }
    return booking;
  }

  async findByCancelToken(token: string): Promise<Booking> {
    const booking = await this.bookingModel
      .findOne({ cancelToken: token })
      // `availability` la necesita la pantalla de reprogramar para saber qué
      // días y horas atiende la cancha.
      .populate('courtId', 'name sport location availability pricePerHour')
      .lean();
    if (!booking) throw new NotFoundException('Token inválido o reserva no encontrada');
    return booking;
  }

  async confirmPayment(bookingId: string): Promise<Booking> {
    const booking = await this.bookingModel.findByIdAndUpdate(
      bookingId,
      { status: BookingStatus.CONFIRMED },
      { new: true },
    );
    if (!booking) throw new NotFoundException('Reserva no encontrada');
    return booking;
  }

  /**
   * Cambia una reserva de horario sin devolver plata.
   *
   * Reemplaza al reembolso: el pago ya se repartió entre el club y la
   * plataforma, y una reversión en ePayco devuelve el total, incluida la
   * tarifa de servicio. Mover el turno no toca la plata. Se permite hasta REPROGRAMAR_HORAS antes del turno original, que es
   * el plazo en el que el club todavía alcanza a revender ese horario.
   *
   * Se conservan cancha y duración: así el precio ya cobrado sigue siendo el
   * correcto y no hay que cobrar ni devolver diferencias.
   */
  async reprogramarByToken(
    token: string,
    nuevo: { date: string; startTime: string; endTime: string },
  ): Promise<Booking> {
    const booking = await this.bookingModel
      .findOne({ cancelToken: token })
      .select('+cancelToken');
    if (!booking) throw new NotFoundException('Token de reserva inválido');

    const horasRestantes = this.horasHastaElTurno(booking);
    if (horasRestantes < REPROGRAMAR_HORAS) {
      throw new BadRequestException(
        `Solo se puede cambiar el horario hasta ${REPROGRAMAR_HORAS} horas antes del turno`,
      );
    }

    const minutos = (hhmm: string) => {
      const [h, m] = hhmm.split(':').map(Number);
      return h * 60 + m;
    };

    const duracionActual = minutos(booking.endTime) - minutos(booking.startTime);
    const duracionNueva  = minutos(nuevo.endTime) - minutos(nuevo.startTime);
    if (duracionNueva !== duracionActual) {
      throw new BadRequestException('El nuevo horario debe durar lo mismo que el original');
    }

    const [anio, mes, dia] = nuevo.date.split('-').map(Number);
    const fechaNueva = new Date(anio, mes - 1, dia);

    await this.assertSlotLibre(
      booking.courtId,
      fechaNueva,
      minutos(nuevo.startTime),
      minutos(nuevo.endTime),
      booking._id,
    );

    booking.date = fechaNueva;
    booking.startTime = nuevo.startTime;
    booking.endTime = nuevo.endTime;
    booking.status = BookingStatus.REAGENDADA;
    booking.reprogramaciones = (booking.reprogramaciones ?? 0) + 1;
    booking.reminderSent = false;
    const guardada = await booking.save();

    this.logger.log(`Reserva ${booking.bookingCode} movida a ${nuevo.date} ${nuevo.startTime}`);

    try {
      await this.notificationsService.sendBookingConfirmation(guardada as any);
    } catch (e) {
      this.logger.error(`Error enviando email de reprogramación: ${e.message}`);
    }

    return this.sinTokens(guardada);
  }

  /** Horas que faltan para que empiece el turno (hora Colombia). */
  private horasHastaElTurno(booking: BookingDocument): number {
    const [h, m] = booking.startTime.split(':').map(Number);
    const inicio = new Date(booking.date);
    inicio.setHours(h, m, 0, 0);
    return (inicio.getTime() - Date.now()) / 1000 / 60 / 60;
  }

  /** Falla si el horario choca con otra reserva o con un bloqueo del club. */
  private async assertSlotLibre(
    courtId: Types.ObjectId,
    fecha: Date,
    inicioMins: number,
    finMins: number,
    ignorarBookingId?: Types.ObjectId,
  ): Promise<void> {
    if (fecha.getTime() < new Date().setHours(0, 0, 0, 0)) {
      throw new BadRequestException('No puedes mover la reserva a una fecha que ya pasó');
    }

    const rango = {
      $gte: new Date(new Date(fecha).setHours(0, 0, 0, 0)),
      $lt: new Date(new Date(fecha).setHours(23, 59, 59, 999)),
    };

    const seCruza = (desde: string, hasta: string) => {
      const [dh, dm] = desde.split(':').map(Number);
      const [hh, hm] = hasta.split(':').map(Number);
      return !(finMins <= dh * 60 + dm || inicioMins >= hh * 60 + hm);
    };

    const ocupadas = await this.bookingModel.find({
      courtId,
      date: rango,
      status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.REAGENDADA] },
      ...(ignorarBookingId ? { _id: { $ne: ignorarBookingId } } : {}),
    }).lean();

    for (const otra of ocupadas) {
      if (seCruza(otra.startTime, otra.endTime)) {
        throw new ConflictException('El horario seleccionado ya no está disponible');
      }
    }

    const bloqueos = await this.blockedSlotModel.find({ courtId, date: rango }).lean();
    for (const bloqueo of bloqueos) {
      if (seCruza(bloqueo.startTime, bloqueo.endTime)) {
        throw new ConflictException('Ese horario está bloqueado por el club');
      }
    }
  }

  /**
   * Borra una reserva. Se usa cuando el pago se rechaza: ya no hay estado
   * "cancelada", asi que la reserva desaparece y el horario queda libre.
   */
  async eliminar(id: string): Promise<void> {
    const booking = await this.bookingModel.findById(id).select('serieId status');
    if (!booking) return;
    /* Si el cobro de un turno fijo no pasa, se caen todas sus fechas. */
    if (booking.serieId && booking.status === BookingStatus.PENDING) {
      await this.bookingModel.deleteMany({ serieId: booking.serieId, status: BookingStatus.PENDING });
      return;
    }
    await this.bookingModel.findByIdAndDelete(id);
  }

  async findByGuestEmail(email: string): Promise<Booking[]> {
    /* Proyeccion explicita, y sin bookingCode a proposito.

       Un correo no es una credencial: cualquiera que lo sepa llega aca. Antes
       esta consulta devolvia el documento entero, asi que entregaba telefono y
       nombre, y sobre todo el bookingCode, con el que la busqueda por codigo
       entrega el cancelToken. Ocultar solo el token no alcanzaba: la toma de
       la reserva seguia a dos saltos en vez de uno.

       Lo que queda es un resumen que no habilita ninguna accion: sirve para
       ver si la reserva quedo hecha y nada mas. El codigo y el enlace para
       mover el turno van por el correo de confirmacion, que solo recibe el
       dueno de la casilla. */
    return this.bookingModel
      .find({ guestEmail: email })
      .select('courtId date startTime endTime status totalPrice')
      .populate('courtId', 'name sport location')
      .lean();
  }

  async findByBookingCode(code: string): Promise<Booking[]> {
    const normalized = code.trim().replace(/#/g, '').toUpperCase();
    if (!normalized) return [];
    /* Tampoco entrega el cancelToken.

       La regla es una sola y se sostiene sola: ninguna consulta por
       identificador devuelve el token. Viaja unicamente en el correo de
       confirmacion, que solo le llega al dueno de la casilla. Mientras se
       entregaba aca, bastaba con encadenar dos o tres consultas publicas para
       llegar al token de un tercero, y cada vez que se tapaba un salto quedaba
       otro. Con el token fuera de la API, la cadena no existe. */
    return this.bookingModel
      .find({ bookingCode: normalized })
      .select(BookingsService.CAMPOS_PUBLICOS)
      .populate('courtId', 'name sport location')
      .lean();
  }

  async findByCourtAndDate(courtId: string, date: string): Promise<any[]> {
    const courtObjectId = aObjectId(courtId, 'Cancha no encontrada');
    const [year, month, day] = date.split('-').map(Number);
    
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const startOfNextDay = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));

    return this.bookingModel
      .find({
        courtId: courtObjectId,
        date: {
          $gte: startOfDay,
          $lt: startOfNextDay,
        },
        status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.REAGENDADA] },
      })
      .select('startTime endTime status')
      .lean();
  }

  /**
   * Turnos que quedan libres en cada cancha para una fecha: los del horario
   * de atención de ese día, menos lo reservado, lo bloqueado y, si la fecha
   * es hoy, lo que ya pasó (hora de Colombia). Con `desde` ("18:00") solo
   * cuentan los que empiezan a esa hora o después.
   */
  async disponibilidad(ids: string[], fecha: string, desde?: string) {
    const validos = ids.filter((id) => Types.ObjectId.isValid(id)).slice(0, 40);
    if (!validos.length || !/^\d{4}-\d{2}-\d{2}$/.test(fecha ?? '')) return {};
    const minDesde = /^\d{2}:\d{2}$/.test(desde ?? '') ? aMinutos(desde!) : 0;

    const [year, month, day] = fecha.split('-').map(Number);
    const inicio = new Date(Date.UTC(year, month - 1, day));
    const fin = new Date(Date.UTC(year, month - 1, day + 1));
    const diaSemana = inicio.getUTCDay();

    /* Colombia no tiene horario de verano: siempre UTC-5. */
    const ahora = new Date(Date.now() - 5 * 3600 * 1000);
    const esHoy = ahora.toISOString().slice(0, 10) === fecha;
    const minAhora = ahora.getUTCHours() * 60 + ahora.getUTCMinutes();

    const objIds = validos.map((id) => new Types.ObjectId(id));
    const [canchas, reservas, bloqueos] = await Promise.all([
      this.courtModel.find({ _id: { $in: objIds }, isActive: { $ne: false } }).select('availability').lean(),
      this.bookingModel
        .find({
          courtId: { $in: objIds },
          date: { $gte: inicio, $lt: fin },
          status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.REAGENDADA] },
        })
        .select('courtId startTime endTime')
        .lean(),
      this.blockedSlotModel
        .find({ courtId: { $in: objIds }, date: { $gte: inicio, $lt: fin } })
        .select('courtId startTime endTime')
        .lean(),
    ]);

    const ocupados = new Map<string, [number, number][]>();
    for (const o of [...reservas, ...bloqueos] as any[]) {
      const k = String(o.courtId);
      if (!ocupados.has(k)) ocupados.set(k, []);
      ocupados.get(k)!.push([aMinutos(o.startTime), aMinutos(o.endTime)]);
    }

    const resultado: Record<string, { libres: number; proximo: string | null }> = {};
    for (const c of canchas as any[]) {
      const horario = (c.availability ?? []).find((a: any) => a.dayOfWeek === diaSemana);
      const libres: number[] = [];
      if (horario) {
        const paso = horario.slotDurationMinutes || 60;
        const abre = aMinutos(horario.openTime);
        const cierra = aMinutos(horario.closeTime);
        const tomados = ocupados.get(String(c._id)) ?? [];
        for (let t = abre; t + paso <= cierra; t += paso) {
          if (t < minDesde) continue;
          if (esHoy && t <= minAhora) continue;
          if (tomados.some(([a, b]) => t < b && t + paso > a)) continue;
          libres.push(t);
        }
      }
      resultado[String(c._id)] = {
        libres: libres.length,
        proximo: libres.length ? aHora(libres[0]) : null,
      };
    }
    return resultado;
  }

  async findByOwnerId(ownerId: string): Promise<Booking[]> {
    const courts = await this.courtModel.find({ ownerId: new Types.ObjectId(ownerId) }).select('_id');
    const courtIds = courts.map(c => c._id);
    return this.bookingModel
      .find({ courtId: { $in: courtIds } })
      .populate('courtId', 'name sport')
      .sort({ date: -1 })
      .lean();
  }

  async findByOwner(ownerCourtIds: string[]): Promise<Booking[]> {
    const objectIds = ownerCourtIds.map(id => new Types.ObjectId(id));
    return this.bookingModel
      .find({ courtId: { $in: objectIds } })
      .populate('courtId', 'name sport')
      .sort({ date: -1 })
      .lean();
  }

  async findAll(page = 1, limit = 20, guestEmail?: string) {
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (guestEmail) filter.guestEmail = { $regex: escaparRegex(guestEmail), $options: 'i' };

    const [data, total] = await Promise.all([
      this.bookingModel.find(filter)
        .populate('courtId', 'name sport')
        .skip(skip).limit(limit)
        .sort({ createdAt: -1 }).lean(),
      this.bookingModel.countDocuments(filter),
    ]);
    return { data, total, page, limit };
  }
}