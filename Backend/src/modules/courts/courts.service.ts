import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Court, CourtDocument, SportType } from './schemas/court.schema';
import { CreateCourtDto } from './dto/create-court.dto';

export interface CourtFilters {
  sport?: SportType;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

@Injectable()
export class CourtsService {
  constructor(
    @InjectModel(Court.name) private courtModel: Model<CourtDocument>,
  ) {}

  async findAll(filters: CourtFilters = {}) {
    const { sport, city, minPrice, maxPrice, page = 1, limit = 12 } = filters;
    const query: any = { isActive: true };

    if (sport) query.sport = sport;
    if (city) query['location.city'] = { $regex: city, $options: 'i' };
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.pricePerHour = {};
      if (minPrice !== undefined) query.pricePerHour.$gte = minPrice;
      if (maxPrice !== undefined) query.pricePerHour.$lte = maxPrice;
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.courtModel
        .find(query)
        .select('-availability')
        .sort({ averageRating: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.courtModel.countDocuments(query),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<Court> {
    const court = await this.courtModel.findById(id).lean();
    if (!court) throw new NotFoundException('Cancha no encontrada');
    return court;
  }

  async findByOwner(ownerId: string): Promise<(Court & { _id: any })[]> {
    return this.courtModel.find({ ownerId: new Types.ObjectId(ownerId) }).lean();
  }

  async create(ownerId: string, dto: CreateCourtDto): Promise<Court> {
    const court = new this.courtModel({ ...dto, ownerId: new Types.ObjectId(ownerId) });
    return court.save();
  }

  async update(id: string, ownerId: string, dto: Partial<CreateCourtDto>): Promise<Court> {
    const court = await this.courtModel.findById(id);
    if (!court) throw new NotFoundException('Cancha no encontrada');
    if (court.ownerId.toString() !== ownerId) throw new ForbiddenException('No tienes permiso');
    Object.assign(court, dto);
    return court.save();
  }

  async updateRating(courtId: string, newAvg: number, total: number) {
    await this.courtModel.findByIdAndUpdate(courtId, {
      averageRating: Math.round(newAvg * 10) / 10,
      totalReviews: total,
    });
  }
}
