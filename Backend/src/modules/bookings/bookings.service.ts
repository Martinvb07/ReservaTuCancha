// 1. Imports SIEMPRE al principio
import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Booking, BookingDocument, BookingStatus } from './schemas/booking.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { NotificationsService } from '../notifications/notifications.service';

// 2. Funciones de utilidad fuera de la clase
function generateBookingCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  // 3. Métodos de la clase organizados
  async findByGuestEmail(email: string): Promise<Booking[]> {
    return this.bookingModel
      .find({ guestEmail: email })
      .populate('courtId', 'name sport location')
      .lean();
  }

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    // Convertir courtId a ObjectId si es string
    const courtId = typeof createBookingDto.courtId === 'string'
      ? new (this.bookingModel.db.base.Types.ObjectId)(createBookingDto.courtId)
      : createBookingDto.courtId;

    // Convertir la fecha string (yyyy-MM-dd) a medianoche local (Colombia)
    let localDate: Date;
    if (typeof createBookingDto.date === 'string' && createBookingDto.date.length === 10) {
      const [year, month, day] = createBookingDto.date.split('-').map(Number);
      localDate = new Date(year, month - 1, day);
    } else {
      localDate = new Date(createBookingDto.date);
    }

    // ✅ NUEVA VALIDACIÓN: Verificar solapamiento de horarios
    const [reqStartHour, reqStartMin] = createBookingDto.startTime.split(':').map(Number);
    const [reqEndHour, reqEndMin] = createBookingDto.endTime.split(':').map(Number);
    const reqStartMins = reqStartHour * 60 + reqStartMin;
    const reqEndMins = reqEndHour * 60 + reqEndMin;

    // Buscar todas las reservas confirmadas o pendientes en esa fecha y cancha
    const existingBookings = await this.bookingModel.find({
      courtId,
      date: {
        $gte: new Date(localDate).setHours(0, 0, 0, 0),
        $lt: new Date(localDate).setHours(23, 59, 59, 999),
      },
      status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
    });

    // Verificar si hay solapamiento de horarios
    for (const booking of existingBookings) {
      const [existHour, existMin] = booking.startTime.split(':').map(Number);
      const [existEndHour, existEndMin] = booking.endTime.split(':').map(Number);
      const existStartMins = existHour * 60 + existMin;
      const existEndMins = existEndHour * 60 + existEndMin;

      // Si hay solapamiento, rechazar
      if (!(reqEndMins <= existStartMins || reqStartMins >= existEndMins)) {
        throw new ConflictException('El horario seleccionado ya no está disponible');
      }
    }

    let bookingCode;
    let exists = true;
    while (exists) {
      bookingCode = generateBookingCode(8);
      exists = !!(await this.bookingModel.exists({ bookingCode }));
    }

    const booking = new this.bookingModel({
      ...createBookingDto,
      courtId, // aseguramos que es ObjectId
      date: localDate, // aseguramos que es medianoche local
      cancelToken: uuidv4(),
      reviewToken: uuidv4(),
      bookingCode,
      status: BookingStatus.PENDING,
    });

    const saved = await booking.save();

    // Aquí es donde enviamos el email fino que configuramos antes
    await this.notificationsService.sendBookingConfirmation(saved as any);

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
      .populate('courtId', 'name sport location')
      .lean();
    if (!booking) throw new NotFoundException('Token inválido o reserva no encontrada');
    if (booking.status === BookingStatus.CANCELLED)
      throw new BadRequestException('Esta reserva ya fue cancelada');
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

  async cancelByToken(token: string): Promise<{ message: string }> {
    const booking = await this.bookingModel.findOne({ cancelToken: token });
    if (!booking) throw new NotFoundException('Token de cancelación inválido');
    if (booking.status === BookingStatus.CANCELLED)
      throw new BadRequestException('Esta reserva ya fue cancelada');

    const hoursUntilBooking = (new Date(booking.date).getTime() - Date.now()) / 1000 / 60 / 60;
    if (hoursUntilBooking < 2)
      throw new BadRequestException('No se puede cancelar con menos de 2 horas de anticipación');

    booking.status = BookingStatus.CANCELLED;
    await booking.save();
    await this.notificationsService.sendCancellationConfirmation(booking as any);
    return { message: 'Reserva cancelada exitosamente' };
  }

  async updateStatus(id: string, status: string): Promise<Booking> {
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status))
      throw new BadRequestException('Estado inválido');

    const booking = await this.bookingModel.findByIdAndUpdate(
      id, { status }, { new: true },
    ).populate('courtId', 'name sport');

    if (!booking) throw new NotFoundException('Reserva no encontrada');

    if (status === 'completed') {
      await this.notificationsService.sendReviewRequest(booking as any);
    }

    return booking;
  }

  async findByCourtAndDate(courtId: string, date: string): Promise<any[]> {
    const { Types } = require('mongoose');
    const courtObjectId = new Types.ObjectId(courtId);

    const [year, month, day] = date.split('-').map(Number);
    
    // Desde el inicio del día hasta el inicio del día siguiente (UTC)
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const startOfNextDay = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));

    const result = await this.bookingModel
      .find({
        courtId: courtObjectId,
        date: {
          $gte: startOfDay,
          $lt: startOfNextDay,
        },
        status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      })
      .select('startTime endTime status')
      .lean();

    return result;
  }

  async findByOwner(ownerCourtIds: string[]): Promise<Booking[]> {
    const { Types } = require('mongoose');
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
    if (guestEmail) filter.guestEmail = { $regex: guestEmail, $options: 'i' };

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