import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument, BookingStatus } from '../bookings/schemas/booking.schema';
import { Court, CourtDocument } from '../courts/schemas/court.schema';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import { Solicitud } from '../solicitudes/solicitudes.schema';

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DAY_NAMES   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Booking.name)    private bookingModel:    Model<BookingDocument>,
    @InjectModel(Court.name)      private courtModel:      Model<CourtDocument>,
    @InjectModel(User.name)       private userModel:       Model<UserDocument>,
    @InjectModel(Solicitud.name)  private solicitudModel:  Model<Solicitud>,
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
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      totalBookings,
      totalRevenue,
      bookingsByStatus,
      bookingsBySport,
      recentBookings,
      // Users & owners
      totalOwners,
      activeOwners,
      newOwnersThisMonth,
      // Courts
      totalCourts,
      activeCourts,
      // Solicitudes
      pendingSolicitudes,
      totalSolicitudes,
      // Subscriptions
      subsByPlan,
      subsByEstado,
      // This month vs last month bookings
      bookingsThisMonth,
      bookingsLastMonth,
      revenueThisMonth,
      revenueLastMonth,
      // Recent solicitudes
      recentSolicitudes,
    ] = await Promise.all([
      this.bookingModel.countDocuments(),
      this.bookingModel.aggregate([
        { $match: { status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] } } },
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
        .populate('courtId', 'name sport')
        .select('guestName guestEmail date startTime endTime status totalPrice paymentMethod createdAt')
        .lean(),
      // Users
      this.userModel.countDocuments({ role: UserRole.OWNER }),
      this.userModel.countDocuments({ role: UserRole.OWNER, isActive: true }),
      this.userModel.countDocuments({ role: UserRole.OWNER, createdAt: { $gte: startOfMonth } }),
      // Courts
      this.courtModel.countDocuments(),
      this.courtModel.countDocuments({ isActive: true }),
      // Solicitudes
      this.solicitudModel.countDocuments({ estado: 'pendiente' }),
      this.solicitudModel.countDocuments(),
      // Subscriptions by plan
      this.userModel.aggregate([
        { $match: { role: UserRole.OWNER } },
        { $group: { _id: '$plan', count: { $sum: 1 } } },
      ]),
      this.userModel.aggregate([
        { $match: { role: UserRole.OWNER } },
        { $group: { _id: '$subscriptionEstado', count: { $sum: 1 } } },
      ]),
      // Bookings this month
      this.bookingModel.countDocuments({ createdAt: { $gte: startOfMonth } }),
      // Bookings last month
      this.bookingModel.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      // Revenue this month
      this.bookingModel.aggregate([
        { $match: { status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] }, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      // Revenue last month
      this.bookingModel.aggregate([
        { $match: { status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] }, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      // Recent solicitudes
      this.solicitudModel
        .find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('firstName lastName businessName estado createdAt')
        .lean(),
    ]);

    // Calculate growth percentages
    const bookingsGrowth = bookingsLastMonth > 0
      ? Math.round(((bookingsThisMonth - bookingsLastMonth) / bookingsLastMonth) * 100)
      : bookingsThisMonth > 0 ? 100 : 0;

    const revThisMonth = revenueThisMonth[0]?.total ?? 0;
    const revLastMonth = revenueLastMonth[0]?.total ?? 0;
    const revenueGrowth = revLastMonth > 0
      ? Math.round(((revThisMonth - revLastMonth) / revLastMonth) * 100)
      : revThisMonth > 0 ? 100 : 0;

    // Map subscription aggregations to objects
    const planCounts: Record<string, number> = {};
    subsByPlan.forEach((s: any) => { planCounts[s._id] = s.count; });
    const estadoCounts: Record<string, number> = {};
    subsByEstado.forEach((s: any) => { estadoCounts[s._id] = s.count; });

    // Build status counts map
    const statusCounts: Record<string, number> = {};
    bookingsByStatus.forEach((s: any) => { statusCounts[s._id] = s.count; });

    return {
      totalBookings,
      totalRevenue: totalRevenue[0]?.total ?? 0,
      confirmedBookings: statusCounts[BookingStatus.CONFIRMED] ?? 0,
      pendingBookings: statusCounts[BookingStatus.PENDING] ?? 0,
      cancelledBookings: statusCounts[BookingStatus.CANCELLED] ?? 0,
      completedBookings: statusCounts[BookingStatus.COMPLETED] ?? 0,
      bookingsByStatus,
      bookingsBySport,
      recentBookings,
      // Owners
      totalOwners,
      activeOwners,
      newOwnersThisMonth,
      // Courts
      totalCourts,
      activeCourts,
      // Solicitudes
      pendingSolicitudes,
      totalSolicitudes,
      recentSolicitudes,
      // Subscriptions
      planCounts,
      estadoCounts,
      activeSubs: estadoCounts['activa'] ?? 0,
      trialSubs: estadoCounts['trial'] ?? 0,
      // Growth
      bookingsThisMonth,
      bookingsLastMonth,
      bookingsGrowth,
      revenueThisMonth: revThisMonth,
      revenueLastMonth: revLastMonth,
      revenueGrowth,
    };
  }

  async getPublicStats() {
    const [totalCourts, totalBookings, totalCities, avgRating] = await Promise.all([
      this.courtModel.countDocuments({ isActive: true }),
      this.bookingModel.countDocuments({ status: { $in: ['confirmed', 'completed'] } }),
      this.courtModel.distinct('location.city', { isActive: true }).then(c => c.length),
      this.courtModel.aggregate([
        { $match: { isActive: true, totalReviews: { $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: '$averageRating' } } },
      ]).then(r => r[0]?.avg ? Math.round(r[0].avg * 10) / 10 : 4.8),
    ]);

    // Top canchas para la landing
    const featuredCourts = await this.courtModel.find({ isActive: true })
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(8)
      .select('name sport location pricePerHour photos averageRating totalReviews')
      .lean();

    // Testimonios: últimas reseñas 5 estrellas (hacemos un aggregate en bookings + reviews no está aquí, así que usamos courts con mejor rating)
    return {
      totalCourts,
      totalBookings,
      totalCities,
      avgRating,
      featuredCourts,
    };
  }
}
