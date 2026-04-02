import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument, BookingStatus } from '../bookings/schemas/booking.schema';
import { Court, CourtDocument } from '../courts/schemas/court.schema';

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DAY_NAMES   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Court.name)   private courtModel:   Model<CourtDocument>,
  ) {}

  async getOwnerStats(ownerId: string) {
    const courts   = await this.courtModel.find({ ownerId: new Types.ObjectId(ownerId) }).select('_id name');
    const courtIds = courts.map(c => c._id);

    const [
      totalBookings, confirmedBookings, pendingBookings,
      cancelledBookings, completedBookings,
      revenueAgg, courtStatsAgg, dayOfWeekAgg, hourAgg,
    ] = await Promise.all([
      this.bookingModel.countDocuments({ courtId: { $in: courtIds } }),
      this.bookingModel.countDocuments({ courtId: { $in: courtIds }, status: BookingStatus.CONFIRMED }),
      this.bookingModel.countDocuments({ courtId: { $in: courtIds }, status: BookingStatus.PENDING }),
      this.bookingModel.countDocuments({ courtId: { $in: courtIds }, status: BookingStatus.CANCELLED }),
      this.bookingModel.countDocuments({ courtId: { $in: courtIds }, status: BookingStatus.COMPLETED }),

      // Ingresos totales (confirmadas + completadas)
      this.bookingModel.aggregate([
        { $match: { courtId: { $in: courtIds }, status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),

      // Stats por cancha
      this.bookingModel.aggregate([
        { $match: { courtId: { $in: courtIds } } },
        { $group: {
          _id: '$courtId',
          bookings: { $sum: 1 },
          revenue:  { $sum: { $cond: [{ $in: ['$status', [BookingStatus.CONFIRMED, BookingStatus.COMPLETED]] }, '$totalPrice', 0] } },
          confirmed: { $sum: { $cond: [{ $eq: ['$status', BookingStatus.CONFIRMED] }, 1, 0] } },
        }},
      ]),

      // Reservas por día de semana (0=Dom … 6=Sáb)
      this.bookingModel.aggregate([
        { $match: { courtId: { $in: courtIds }, status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.PENDING] } } },
        { $group: { _id: { $dayOfWeek: '$date' }, count: { $sum: 1 } } },
        { $sort: { '_id': 1 } },
      ]),

      // Reservas por hora de inicio
      this.bookingModel.aggregate([
        { $match: { courtId: { $in: courtIds }, status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.PENDING] } } },
        { $group: { _id: { $substr: ['$startTime', 0, 2] }, count: { $sum: 1 } } },
        { $sort: { '_id': 1 } },
      ]),
    ]);

    // Mapear courtStats con nombres reales
    const courtMap = new Map(courts.map(c => [c._id.toString(), (c as any).name]));
    const courtStats = courtStatsAgg.map(s => ({
      name:      courtMap.get(s._id.toString()) ?? 'Cancha',
      bookings:  s.bookings,
      revenue:   s.revenue,
      confirmed: s.confirmed,
    })).sort((a, b) => b.revenue - a.revenue);

    // Días de semana — MongoDB $dayOfWeek: 1=Dom, 7=Sáb
    const dayStats = Array.from({ length: 7 }, (_, i) => ({
      day:   DAY_NAMES[i],
      count: 0,
    }));
    dayOfWeekAgg.forEach(d => {
      const idx = (d._id - 1) % 7; // 1→0, 2→1 … 7→6
      dayStats[idx].count = d.count;
    });

    // Horas populares
    const hourStats = hourAgg.map(h => ({
      hour:  `${h._id}:00`,
      count: h.count,
    }));

    const totalRevenue = revenueAgg[0]?.total ?? 0;
    const confirmRate  = totalBookings > 0 ? Math.round((confirmedBookings + completedBookings) / totalBookings * 100) : 0;

    return {
      totalBookings, confirmedBookings, pendingBookings,
      cancelledBookings, completedBookings,
      totalRevenue, confirmRate,
      totalCourts: courts.length,
      avgRevenue:  confirmedBookings + completedBookings > 0
        ? Math.round(totalRevenue / (confirmedBookings + completedBookings)) : 0,
      courtStats, dayStats, hourStats,
    };
  }

  async getMonthlyRevenue(ownerId?: string) {
    const matchStage: any = { status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] } };
    if (ownerId) {
      const courts = await this.courtModel.find({ ownerId: new Types.ObjectId(ownerId) }).select('_id');
      matchStage.courtId = { $in: courts.map(c => c._id) };
    }

    const raw = await this.bookingModel.aggregate([
      { $match: matchStage },
      { $group: {
        _id:      { year: { $year: '$date' }, month: { $month: '$date' } },
        revenue:  { $sum: '$totalPrice' },
        bookings: { $sum: 1 },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]);

    return raw.map(r => ({
      month:    `${MONTH_NAMES[r._id.month - 1]} ${r._id.year}`,
      monthShort: MONTH_NAMES[r._id.month - 1],
      revenue:  r.revenue,
      bookings: r.bookings,
    }));
  }

  async getAdminStats() {
    const [totalBookings, totalRevenue, bookingsByStatus, bookingsBySport, recentActivity] =
      await Promise.all([
        this.bookingModel.countDocuments(),
        this.bookingModel.aggregate([
          { $match: { status: BookingStatus.CONFIRMED } },
          { $group: { _id: null, total: { $sum: '$totalPrice' } } },
        ]),
        this.bookingModel.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        this.bookingModel.aggregate([
          { $lookup: { from: 'courts', localField: 'courtId', foreignField: '_id', as: 'court' } },
          { $unwind: '$court' },
          { $group: { _id: '$court.sport', count: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
          { $sort: { count: -1 } },
        ]),
        this.bookingModel
          .find()
          .sort({ createdAt: -1 })
          .limit(10)
          .select('guestName date startTime status totalPrice')
          .lean(),
      ]);

    return {
      totalBookings,
      totalRevenue: totalRevenue[0]?.total ?? 0,
      bookingsByStatus, bookingsBySport, recentActivity,
    };
  }
}
