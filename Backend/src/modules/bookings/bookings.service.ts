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
import { Booking, BookingDocument, BookingStatus } from './schemas/booking.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { WompiService } from '../wompi/wompi.service';
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
    private readonly wompiService: WompiService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  // --- MÉTODOS PARA EL WEBHOOK ---

  /**
   * Busca una reserva por su código único (referencia de Wompi)
   */
  async findByCode(code: string): Promise<BookingDocument | null> {
    return this.bookingModel.findOne({ bookingCode: code }).populate('courtId').exec();
  }

  /**
   * Actualiza el estado y opcionalmente el ID de transacción de Wompi
   */
  async updateStatus(
    id: string,
    updateData: { status: string; wompiTransactionId?: string },
    userId?: string,
    userRole?: string,
  ): Promise<Booking> {
    const { status, wompiTransactionId } = updateData;

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
    }

    const updatePayload: any = { status };
    if (wompiTransactionId) {
      updatePayload.wompiTransactionId = wompiTransactionId;
    }

    const updated = await this.bookingModel.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true }
    ).select('+cancelToken +reviewToken').populate('courtId', 'name sport');

    if (!updated) throw new NotFoundException('Reserva no encontrada');

    // Notificaciones automáticas según cambio de estado
    if (status === 'confirmed') {
      await this.notificationsService.sendBookingConfirmation(updated as any);
    }

    if (status === 'completed') {
      await this.notificationsService.sendReviewRequest(updated as any);
    }

    return updated;
  }

  // --- LÓGICA DE PAGOS ---

  async initPayment(bookingId: string, redirectUrl: string) {
    const booking = await this.bookingModel
      .findById(bookingId)
      .populate('courtId');
      
    if (!booking) throw new NotFoundException('Reserva no encontrada');

    /* El cobro se recibe a nombre de ReservaTuCancha, no del club: al club se
       le gira su parte en la liquidación semanal, ya sin la comisión. */
    if (!this.wompiService.configured) {
      throw new BadRequestException('Los pagos en línea no están disponibles en este momento');
    }

    const checkoutUrl = this.wompiService.generateCheckoutUrl(
      booking.totalPrice,
      booking.bookingCode,
      this.resolverRedirect(bookingId, redirectUrl),
    );

    return {
      redirectUrl: checkoutUrl,
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

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    const courtId = typeof createBookingDto.courtId === 'string'
      ? new Types.ObjectId(createBookingDto.courtId)
      : createBookingDto.courtId;

    /* La cancha manda el precio. Antes el total venia en el body y cualquiera
       podia crear la reserva por un peso y pagar eso en el checkout. */
    const cancha = await this.courtModel.findById(courtId).lean();
    if (!cancha || cancha.isActive === false) {
      throw new NotFoundException('Cancha no encontrada');
    }

    let localDate: Date;
    if (typeof createBookingDto.date === 'string' && createBookingDto.date.length === 10) {
      const [year, month, day] = createBookingDto.date.split('-').map(Number);
      localDate = new Date(year, month - 1, day);
    } else {
      localDate = new Date(createBookingDto.date);
    }

    const [reqStartHour, reqStartMin] = createBookingDto.startTime.split(':').map(Number);
    const [reqEndHour, reqEndMin] = createBookingDto.endTime.split(':').map(Number);
    const reqStartMins = reqStartHour * 60 + reqStartMin;
    const reqEndMins = reqEndHour * 60 + reqEndMin;

    const duracionMins = reqEndMins - reqStartMins;
    if (duracionMins <= 0) {
      throw new BadRequestException('La hora de fin debe ser posterior a la de inicio');
    }
    const totalPrice = Math.round((cancha.pricePerHour * duracionMins) / 60);

    // Validar que la reserva no sea en el pasado (hora Colombia)
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const nowParts = Object.fromEntries(fmt.formatToParts(new Date()).map(p => [p.type, p.value]));
    const todayYMD = `${nowParts.year}-${nowParts.month}-${nowParts.day}`;
    const nowMins = Number(nowParts.hour) * 60 + Number(nowParts.minute);
    const bookingYMD = typeof createBookingDto.date === 'string' && createBookingDto.date.length >= 10
      ? createBookingDto.date.slice(0, 10)
      : `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;

    if (bookingYMD < todayYMD) {
      throw new BadRequestException('No puedes reservar una fecha que ya pasó');
    }
    if (bookingYMD === todayYMD && reqStartMins <= nowMins) {
      throw new BadRequestException('No puedes reservar un horario que ya pasó');
    }

    const existingBookings = await this.bookingModel.find({
      courtId,
      date: {
        $gte: new Date(localDate).setHours(0, 0, 0, 0),
        $lt: new Date(localDate).setHours(23, 59, 59, 999),
      },
      status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.REAGENDADA] },
    });

    for (const booking of existingBookings) {
      const [existHour, existMin] = booking.startTime.split(':').map(Number);
      const [existEndHour, existEndMin] = booking.endTime.split(':').map(Number);
      const existStartMins = existHour * 60 + existMin;
      const existEndMins = existEndHour * 60 + existEndMin;

      if (!(reqEndMins <= existStartMins || reqStartMins >= existEndMins)) {
        throw new ConflictException('El horario seleccionado ya no está disponible');
      }
    }

    // Verificar si el horario está bloqueado por el owner
    const blocks = await this.blockedSlotModel.find({
      courtId,
      date: {
        $gte: new Date(localDate).setHours(0, 0, 0, 0),
        $lt: new Date(localDate).setHours(23, 59, 59, 999),
      },
    }).lean();

    for (const block of blocks) {
      const [bStartH, bStartM] = block.startTime.split(':').map(Number);
      const [bEndH, bEndM] = block.endTime.split(':').map(Number);
      const bStartMins = bStartH * 60 + bStartM;
      const bEndMins = bEndH * 60 + bEndM;
      if (!(reqEndMins <= bStartMins || reqStartMins >= bEndMins)) {
        throw new ConflictException('Este horario está bloqueado por el propietario');
      }
    }

    let bookingCode;
    let exists = true;
    while (exists) {
      bookingCode = generarCodigoReserva(8);
      exists = !!(await this.bookingModel.exists({ bookingCode }));
    }

    const booking = new this.bookingModel({
      ...createBookingDto,
      courtId,
      totalPrice,
      date: localDate,
      cancelToken: uuidv4(),
      reviewToken: uuidv4(),
      bookingCode,
      status: BookingStatus.PENDING,
    });

    const saved = await booking.save();

    this.logger.log(`Reserva creada: ${saved.bookingCode} | método: ${createBookingDto.paymentMethod ?? 'no especificado'}`);

    // Notificación en tiempo real + email al owner
    try {
      const court = cancha;
      if (court) {
        this.notificationsGateway.notifyNewBooking(court.ownerId.toString(), {
          ...saved.toObject(),
          courtId: court,
        });
        // Email al owner
        const owner = await this.userModel.findById(court.ownerId).select('email').lean();
        if (owner?.email) {
          this.notificationsService.sendOwnerNewBookingNotification(saved as any, owner.email).catch(
            (e) => this.logger.error(`Error email owner: ${e.message}`),
          );
        }
      }
    } catch (e) {
      this.logger.error(`Error enviando notification al owner: ${e.message}`);
    }

    return saved;
  }

  async findById(id: string): Promise<Booking> {
    const booking = await this.bookingModel
      .findById(id)
      .populate('courtId', 'name sport location pricePerHour')
      .lean();
    if (!booking) throw new NotFoundException('Reserva no encontrada');
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
   * Reemplaza al reembolso: el dinero ya entró a la cuenta de la empresa y se
   * le gira al club en la liquidación de la semana en que efectivamente se
   * juegue. Se permite hasta REPROGRAMAR_HORAS antes del turno original, que es
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

    return guardada;
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
    await this.bookingModel.findByIdAndDelete(id);
  }

  async findByGuestEmail(email: string): Promise<Booking[]> {
    return this.bookingModel
      .find({ guestEmail: email })
      .populate('courtId', 'name sport location')
      .lean();
  }

  async findByBookingCode(code: string): Promise<Booking[]> {
    const normalized = code.trim().replace(/#/g, '').toUpperCase();
    if (!normalized) return [];
    /* Con el codigo en la mano si se entrega el cancelToken: el codigo solo lo
       tiene quien hizo la reserva. La busqueda por correo, en cambio, no lo
       devuelve, y por eso el boton de reprogramar no aparece ahi. */
    return this.bookingModel
      .find({ bookingCode: normalized })
      .select('+cancelToken')
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