import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Club, ClubDocument } from './schemas/club.schema';
import { Court, CourtDocument } from '../courts/schemas/court.schema';

@Injectable()
export class ClubsService {
  constructor(
    @InjectModel(Club.name) private clubModel: Model<ClubDocument>,
    @InjectModel(Court.name) private courtModel: Model<CourtDocument>,
  ) {}

  async findClubsBySportAndCity(deporte: string, ciudad: string) {
    let clubQuery: any = {};
    if (ciudad) {
      clubQuery.city = { $regex: `^${ciudad.trim()}$`, $options: 'i' };
    }

    let clubs: any[];

    if (!deporte || deporte === 'all') {
      clubs = await this.clubModel.find(clubQuery).exec();
    } else {
      const courts = await this.courtModel.find({ sport: deporte }).exec();
      const ownerIds = [...new Set(courts.map(c => (c.ownerId as any).toString()))].map(
        id => new Types.ObjectId(id as string)
      );
      if (ownerIds.length === 0) return [];
      clubQuery.ownerUserId = { $in: ownerIds };
      clubs = await this.clubModel.find(clubQuery).exec();
    }

    // Enriquecer con deportes y total de canchas
    const enriched = await Promise.all(
      clubs.map(async (club: any) => {
        const courts = await this.courtModel
          .find({ ownerId: club.ownerUserId })
          .select('sport')
          .exec();

        const sports = [...new Set(courts.map((c: any) => c.sport as string))];
        const totalCourts = courts.length;

        return {
          _id: club._id,
          name: club.name,
          logo: club.logo,
          address: club.address,
          city: club.city,
          contactEmail: club.contactEmail,
          contactPhone: club.contactPhone,
          ownerUserId: club.ownerUserId,
          sports,
          totalCourts,
        };
      })
    );

    return enriched;
  }
}