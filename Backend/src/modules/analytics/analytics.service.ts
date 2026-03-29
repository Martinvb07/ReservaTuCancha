import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument, BookingStatus } from '../bookings/schemas/booking.schema';
import { Court, CourtDocument } from '../courts/schemas/court.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Court.name) private courtModel: Model<CourtDocument>,
  ) {}

  // Stats para propietario — sus canchas
  async getOwnerStats(ownerId: string) {
    const courts = await this.courtModel.find({ ownerId: new Types.ObjectId(ownerId) }).select('_id');
    const courtIds = courts.map((c) => c._id);

    const [totalBookings, confirmedBookings, pendingBookings, revenue, topCourt] = await Promise.all([
      this.bookingModel.countDocuments({ courtId: { $in: courtIds } }),
      this.bookingModel.countDocuments({ courtId: { $in: courtIds }, status: BookingStatus.CONFIRMED }),
      this.bookingModel.countDocuments({ courtId: { $in: courtIds }, status: BookingStatus.PENDING }),
      this.bookingModel.aggregate([
        { $match: { courtId: { $in: courtIds }, status: BookingStatus.CONFIRMED } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      this.bookingModel.aggregate([
        { $match: { courtId: { $in: courtIds }, status: BookingStatus.CONFIRMED } },
        { $group: { _id: '$courtId', count: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
        { $sort: { revenue: -1 } },
        { $limit: 1 },
      ]),
    ]);

    return {
      totalBookings,
      confirmedBookings,
      pendingBookings,
      totalRevenue: revenue[0]?.total ?? 0,
      topCourt: topCourt[0] ?? null,
      totalCourts: courts.length,
    };
  }

  // Stats globales para admin
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
          {
            $lookup: {
              from: 'courts', localField: 'courtId',
              foreignField: '_id', as: 'court',
            },
          },
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
      bookingsByStatus,
      bookingsBySport,
      recentActivity,
    };
  }

  // Ingresos por mes para gráfico
  async getMonthlyRevenue(ownerId?: string) {
    const matchStage: any = { status: BookingStatus.CONFIRMED };
    if (ownerId) {
      const courts = await this.courtModel.find({ ownerId: new Types.ObjectId(ownerId) }).select('_id');
      matchStage.courtId = { $in: courts.map((c) => c._id) };
    }

    return this.bookingModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          revenue: { $sum: '$totalPrice' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]);
  }
}
