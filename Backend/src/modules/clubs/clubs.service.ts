import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Club, ClubDocument } from './schemas/club.schema';
import { Court, CourtDocument } from '../courts/schemas/court.schema';
import { Review, ReviewDocument } from '../reviews/schemas/review.schema';
import { PlanLimitsService } from '../users/plan-limits.service';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

@Injectable()
export class ClubsService {
  constructor(
    @InjectModel(Club.name)   private clubModel:   Model<ClubDocument>,
    @InjectModel(Court.name)  private courtModel:  Model<CourtDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    private readonly planLimits: PlanLimitsService,
  ) {}

  async findMyClub(userId: string) {
    // Buscamos por ownerUserId que es un string o ObjectId en el schema
    const club = await this.clubModel.findOne({ ownerUserId: new Types.ObjectId(userId) }).exec();
    if (!club) return null;

    // Obtenemos las canchas para sacar los deportes disponibles
    const courts = await this.courtModel.find({ ownerId: userId }).select('sport').exec();
    const sports = [...new Set(courts.map((c) => c.sport))];

    // Aseguramos que el _id esté explícitamente incluido
    const clubObj = club.toObject();
    const clubId = club._id ? club._id.toString() : clubObj._id;
    
    return {
      _id: clubId,
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
    wompiData: { wompiPublicKey: string; wompiIntegritySecret?: string; wompiEventsSecret?: string },
    userId: string
  ) {
    // PLAN: Verificar que el plan del usuario permite configurar Wompi
    await this.planLimits.assertCanConfigureWompi(userId);

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
    club.wompiPublicKey = wompiData.wompiPublicKey;
    if (wompiData.wompiIntegritySecret?.trim()) {
      club.wompiIntegritySecret = wompiData.wompiIntegritySecret;
    }
    if (wompiData.wompiEventsSecret?.trim()) {
      club.wompiEventsSecret = wompiData.wompiEventsSecret;
    }
    club.wompiConfigured = !!(club.wompiPublicKey && club.wompiIntegritySecret);

    await club.save();

    return {
      message: 'Credenciales de Wompi vinculadas correctamente',
      wompiConfigured: true,
    };
  }

  async findBySlug(slug: string) {
    let club = await this.clubModel.findOne({ slug }).lean();

    // Si no tiene slug aún, buscar todos y generar (migración lazy)
    if (!club) {
      const all = await this.clubModel.find().lean();
      for (const c of all) {
        if (!c.slug) {
          const generated = generateSlug(c.name);
          await this.clubModel.findByIdAndUpdate(c._id, { slug: generated });
          if (generated === slug) {
            club = { ...c, slug: generated };
          }
        }
      }
    }

    if (!club) throw new NotFoundException('Club no encontrado');

    // Canchas con fotos
    const courts = await this.courtModel
      .find({ ownerId: club.ownerUserId, isActive: true })
      .lean();

    // Reseñas de todas las canchas del club
    const courtIds = courts.map(c => c._id);
    const reviews = await this.reviewModel
      .find({ courtId: { $in: courtIds }, isVisible: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const avgRating = reviews.length
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

    return {
      _id: club._id,
      name: club.name,
      slug: club.slug,
      logo: club.logo,
      address: club.address,
      city: club.city,
      description: (club as any).description,
      contactPhone: club.contactPhone,
      contactEmail: club.contactEmail,
      courts: courts.map(c => ({
        _id: c._id,
        name: c.name,
        sport: c.sport,
        pricePerHour: c.pricePerHour,
        photos: c.photos,
        averageRating: c.averageRating,
        totalReviews: c.totalReviews,
        amenities: c.amenities,
        availability: c.availability,
      })),
      reviews: reviews.map(r => ({
        _id: r._id,
        guestName: r.guestName,
        rating: r.rating,
        comment: r.comment,
        createdAt: (r as any).createdAt,
        courtName: courts.find(c => c._id.toString() === r.courtId.toString())?.name ?? '',
      })),
      totalCourts: courts.length,
      totalReviews: reviews.length,
      avgRating,
    };
  }

  async ensureSlug(clubId: string) {
    const club = await this.clubModel.findById(clubId);
    if (!club) throw new NotFoundException('Club no encontrado');
    if (!club.slug) {
      club.slug = generateSlug(club.name);
      await club.save();
    }
    return { slug: club.slug };
  }
}