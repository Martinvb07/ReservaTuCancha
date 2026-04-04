import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Court, CourtDocument, SportType } from './schemas/court.schema';
import { BlockedSlot, BlockedSlotDocument } from './schemas/blocked-slot.schema';
import { CreateCourtDto } from './dto/create-court.dto';
import { BlockSlotDto } from './dto/block-slot.dto';
import { Club, ClubDocument } from '../clubs/schemas/club.schema';
import { PlanLimitsService } from '../users/plan-limits.service';

export interface CourtFilters {
  sport?: SportType;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  ownerId?: string;
}

@Injectable()
export class CourtsService {
  constructor(
    @InjectModel(Court.name) private courtModel: Model<CourtDocument>,
    @InjectModel(Club.name)  private clubModel:  Model<ClubDocument>,
    @InjectModel(BlockedSlot.name) private blockedSlotModel: Model<BlockedSlotDocument>,
    private readonly planLimits: PlanLimitsService,
  ) {}

  async findAll(filters: CourtFilters = {}) {
    const { sport, city, minPrice, maxPrice, page = 1, limit = 12, ownerId } = filters;
    const query: any = { isActive: true };

    if (sport) query.sport = sport;
    if (city) query['location.city'] = { $regex: city, $options: 'i' };
    if (ownerId) {
      // Convertir el string a ObjectId si es necesario
      const { Types } = require('mongoose');
      try {
        query.ownerId = new Types.ObjectId(ownerId);
      } catch (e) {
        // Si no es un ObjectId válido, no filtrar por ownerId
      }
    }
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
    await this.planLimits.assertCanCreateCourt(ownerId);
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

  async addPhoto(courtId: string, ownerId: string, url: string): Promise<Court> {
    const court = await this.courtModel.findById(courtId);
    if (!court) throw new NotFoundException('Cancha no encontrada');
    if (court.ownerId.toString() !== ownerId) throw new ForbiddenException('No tienes permiso');
    if (court.photos.includes(url)) return court.toObject();
    court.photos.push(url);
    return court.save();
  }

  async removePhoto(courtId: string, ownerId: string, url: string): Promise<Court> {
    const court = await this.courtModel.findById(courtId);
    if (!court) throw new NotFoundException('Cancha no encontrada');
    if (court.ownerId.toString() !== ownerId) throw new ForbiddenException('No tienes permiso');
    court.photos = court.photos.filter(p => p !== url);
    return court.save();
  }

  async updateRating(courtId: string, newAvg: number, total: number) {
    await this.courtModel.findByIdAndUpdate(courtId, {
      averageRating: Math.round(newAvg * 10) / 10,
      totalReviews: total,
    });
  }

  async getWompiConfig(courtId: string) {
    const court = await this.courtModel.findById(courtId).lean();
    if (!court) throw new NotFoundException('Cancha no encontrada');

    const club = await this.clubModel.findOne({ ownerUserId: court.ownerId }).lean();
    if (!club) throw new NotFoundException('Club no encontrado');

    if (!club.wompiPublicKey || !club.wompiIntegritySecret) {
      return {
        configured: false,
        message: 'El propietario de esta cancha no ha configurado Wompi aún',
      };
    }

    return {
      configured: true,
      wompiPublicKey: club.wompiPublicKey,
      wompiMerchantId: club.wompiMerchantId,
    };
  }

  // ─── BLOQUEO DE HORARIOS ──────────────────────────────────────────────

  async createBlockedSlot(ownerId: string, dto: BlockSlotDto) {
    const court = await this.courtModel.findById(dto.courtId);
    if (!court) throw new NotFoundException('Cancha no encontrada');
    if (court.ownerId.toString() !== ownerId) throw new ForbiddenException('No tienes permiso');

    const [year, month, day] = dto.date.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);

    const slot = new this.blockedSlotModel({
      courtId: new Types.ObjectId(dto.courtId),
      date: localDate,
      startTime: dto.startTime,
      endTime: dto.endTime,
      reason: dto.reason,
    });
    return slot.save();
  }

  async getBlockedSlots(courtId: string, date?: string) {
    const filter: any = { courtId: new Types.ObjectId(courtId) };
    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
      const end = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0));
      filter.date = { $gte: start, $lt: end };
    }
    return this.blockedSlotModel.find(filter).sort({ date: 1, startTime: 1 }).lean();
  }

  async getBlockedSlotsByOwner(ownerId: string): Promise<any[]> {
    const courts = await this.courtModel.find({ ownerId: new Types.ObjectId(ownerId) }).select('_id name').lean();
    const courtIds = courts.map(c => c._id);
    const slots = await this.blockedSlotModel.find({ courtId: { $in: courtIds } })
      .sort({ date: 1, startTime: 1 }).lean();
    // Enriquecer con nombre de cancha
    const courtMap = new Map(courts.map(c => [c._id.toString(), c.name]));
    return slots.map(s => ({ ...s, courtName: courtMap.get(s.courtId.toString()) || '-' }));
  }

  async deleteBlockedSlot(ownerId: string, slotId: string) {
    const slot = await this.blockedSlotModel.findById(slotId);
    if (!slot) throw new NotFoundException('Bloqueo no encontrado');
    const court = await this.courtModel.findById(slot.courtId);
    if (!court || court.ownerId.toString() !== ownerId) throw new ForbiddenException('No tienes permiso');
    await this.blockedSlotModel.findByIdAndDelete(slotId);
    return { message: 'Bloqueo eliminado' };
  }

  async isSlotBlocked(courtId: string, date: Date, startTime: string, endTime: string): Promise<boolean> {
    const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);

    const [reqStartH, reqStartM] = startTime.split(':').map(Number);
    const [reqEndH, reqEndM] = endTime.split(':').map(Number);
    const reqStartMins = reqStartH * 60 + reqStartM;
    const reqEndMins = reqEndH * 60 + reqEndM;

    const blocks = await this.blockedSlotModel.find({
      courtId: new Types.ObjectId(courtId),
      date: { $gte: startOfDay, $lte: endOfDay },
    }).lean();

    for (const block of blocks) {
      const [bStartH, bStartM] = block.startTime.split(':').map(Number);
      const [bEndH, bEndM] = block.endTime.split(':').map(Number);
      const bStartMins = bStartH * 60 + bStartM;
      const bEndMins = bEndH * 60 + bEndM;
      if (!(reqEndMins <= bStartMins || reqStartMins >= bEndMins)) return true;
    }
    return false;
  }
}
