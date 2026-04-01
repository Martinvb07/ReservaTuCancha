import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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

  async findMyClub(userId: string) {
    // Buscamos por ownerUserId que es un string o ObjectId en el schema
    const club = await this.clubModel.findOne({ ownerUserId: userId }).exec();
    if (!club) return null;

    // Obtenemos las canchas para sacar los deportes disponibles
    const courts = await this.courtModel.find({ ownerId: userId }).select('sport').exec();
    const sports = [...new Set(courts.map((c) => c.sport))];

    // Aseguramos que el _id esté explícitamente incluido
    const clubObj = club.toObject();
    
    return {
      _id: clubObj._id?.toString(),
      ...clubObj,
      sports,
      totalCourts: courts.length,
    };
  }

  async findClubsBySportAndCity(deporte: string, ciudad: string) {
    let clubQuery: any = {};
    
    if (ciudad && ciudad !== 'all') {
      clubQuery.city = { $regex: `^${ciudad.trim()}$`, $options: 'i' };
    }

    let clubs: ClubDocument[];

    if (!deporte || deporte === 'all') {
      clubs = await this.clubModel.find(clubQuery).exec();
    } else {
      // 1. Buscamos canchas que tengan ese deporte
      const courts = await this.courtModel.find({ sport: deporte }).exec();
      
      // 2. Extraemos los ownerIds únicos y válidos
      const ownerIds = [...new Set(courts.map(c => c.ownerId.toString()))]
        .filter(id => Types.ObjectId.isValid(id))
        .map(id => new Types.ObjectId(id));
      
      if (ownerIds.length === 0) return [];
      
      clubQuery.ownerUserId = { $in: ownerIds };
      clubs = await this.clubModel.find(clubQuery).exec();
    }

    // Enriquecemos la data (Deportes y conteo)
    const enriched = await Promise.all(
      clubs.map(async (club) => {
        const courts = await this.courtModel
          .find({ ownerId: club.ownerUserId })
          .select('sport')
          .exec();

        const sports = [...new Set(courts.map((c) => c.sport as string))];
        
        return {
          _id: club._id,
          name: club.name,
          logo: club.logo,
          address: club.address,
          city: club.city,
          contactEmail: club.contactEmail,
          contactPhone: club.contactPhone,
          ownerUserId: club.ownerUserId,
          wompiConfigured: club.wompiConfigured,
          sports,
          totalCourts: courts.length,
        };
      })
    );

    return enriched;
  }

  async updateWompiCredentials(
    clubId: string, 
    wompiData: { wompiMerchantId: string; wompiPublicKey: string; wompiApiKey: string }, 
    userId: string
  ) {
    // PREVENCIÓN: Validar el ID del club para evitar el crash del server (Error 500)
    if (!Types.ObjectId.isValid(clubId)) {
      throw new NotFoundException('El ID del club no es un formato válido de MongoDB.');
    }

    const club = await this.clubModel.findById(clubId);
    
    if (!club) {
      throw new NotFoundException('No se encontró el club para actualizar las credenciales.');
    }
    
    // SEGURIDAD: Validar que el que pide el cambio es el dueño real
    if (club.ownerUserId.toString() !== userId.toString()) {
      throw new ForbiddenException('No tienes permisos para configurar los pagos de este club.');
    }

    // Actualización de campos
    club.wompiMerchantId = wompiData.wompiMerchantId;
    club.wompiPublicKey = wompiData.wompiPublicKey;
    club.wompiApiKey = wompiData.wompiApiKey;
    club.wompiConfigured = true;

    await club.save();

    return {
      message: 'Credenciales de Wompi vinculadas correctamente',
      wompiConfigured: true,
    };
  }
}