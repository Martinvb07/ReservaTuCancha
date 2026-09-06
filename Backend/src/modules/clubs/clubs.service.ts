import { Injectable, Logger, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { escaparRegex } from '../../common/utils/regex.util';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Club, ClubDocument } from './schemas/club.schema';
import { Court, CourtDocument } from '../courts/schemas/court.schema';
import { Review, ReviewDocument } from '../reviews/schemas/review.schema';
import { DatosBancariosDto } from './dto/datos-bancarios.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

/** Nombre que se le muestra al admin cuando el método no es una cuenta bancaria. */
const ETIQUETA_METODO: Record<string, string> = {
  nequi:     'Nequi',
  daviplata: 'Daviplata',
  breb:      'Llave Bre-B',
};

const ETIQUETA_LLAVE: Record<string, string> = {
  alfanumerica: 'Alfanumérica (@)',
  celular:      'Celular',
  correo:       'Correo',
  documento:    'Documento',
};

/** Filas del correo de aviso: solo lo que aplica al método elegido. */
function resumenBanco(banco: Club['banco']): { label: string; value: string }[] {
  if (!banco) return [];
  const filas = [
    { label: 'Método',  value: banco.banco ?? banco.metodo ?? '-' },
    { label: 'Titular', value: banco.titular ?? '-' },
    { label: 'Documento', value: banco.documento ?? '-' },
  ];
  if (banco.tipoCuenta) {
    filas.push({ label: 'Tipo de cuenta', value: banco.tipoCuenta === 'ahorros' ? 'Ahorros' : 'Corriente' });
  }
  if (banco.numero) filas.push({ label: 'Número', value: banco.numero });
  if (banco.llave) {
    filas.push({ label: 'Llave', value: banco.llave });
    if (banco.tipoLlave) filas.push({ label: 'Tipo de llave', value: ETIQUETA_LLAVE[banco.tipoLlave] ?? banco.tipoLlave });
  }
  return filas;
}

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
  private readonly logger = new Logger(ClubsService.name);

  constructor(
    @InjectModel(Club.name)   private clubModel:   Model<ClubDocument>,
    @InjectModel(Court.name)  private courtModel:  Model<CourtDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    private readonly usersService: UsersService,
    /* NotificationsService ya depende de este servicio, de ahí el forwardRef. */
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificaciones: NotificationsService,
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
      clubQuery.city = { $regex: `^${escaparRegex(ciudad.trim())}$`, $options: 'i' };
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
          // El club ya no configura pasarela; lo que importa es si registró
          // la cuenta a la que se le gira la liquidación semanal.
          bancoConfigurado: !!club.banco?.numero,
          sports,
          totalCourts: courts.length,
        };
      })
    );

    return enriched;
  }

  async updateProfile(userId: string, body: Record<string, any>) {
    const club = await this.clubModel.findOne({ ownerUserId: new Types.ObjectId(userId) });
    if (!club) throw new NotFoundException('Club no encontrado');

    const allowed = [
      'name', 'description', 'address', 'city',
      'contactPhone', 'contactEmail', 'logo',
      'slogan', 'schedule', 'socialLinks',
    ];

    for (const key of allowed) {
      if (body[key] !== undefined) {
        (club as any)[key] = body[key];
      }
    }

    if (body.name !== undefined) {
      club.slug = generateSlug(body.name);
    }

    await club.save();
    return club.toObject();
  }

  async addClubPhoto(userId: string, url: string) {
    const club = await this.clubModel.findOne({ ownerUserId: new Types.ObjectId(userId) });
    if (!club) throw new NotFoundException('Club no encontrado');
    if (!(club as any).photos) (club as any).photos = [];
    if (!(club as any).photos.includes(url)) {
      (club as any).photos.push(url);
      await club.save();
    }
    return club.toObject();
  }

  async removeClubPhoto(userId: string, url: string) {
    const club = await this.clubModel.findOne({ ownerUserId: new Types.ObjectId(userId) });
    if (!club) throw new NotFoundException('Club no encontrado');
    (club as any).photos = ((club as any).photos || []).filter((p: string) => p !== url);
    await club.save();
    return club.toObject();
  }

  /**
   * Cuenta donde el club recibe su liquidación semanal.
   *
   * Reemplaza a la configuración de Wompi por club: ahora todos los cobros
   * entran a la cuenta de ReservaTuCancha y cada lunes se transfiere aquí.
   */
  async updateDatosBancarios(clubId: string, dto: DatosBancariosDto, userId: string) {
    // PREVENCIÓN: Validar el ID del club para evitar el crash del server (Error 500)
    if (!Types.ObjectId.isValid(clubId)) {
      throw new NotFoundException('El ID del club no es un formato válido de MongoDB.');
    }

    const club = await this.clubModel.findById(clubId);
    if (!club) {
      throw new NotFoundException('No se encontró el club para actualizar la cuenta.');
    }

    // SEGURIDAD: Validar que el que pide el cambio es el dueño real
    if (club.ownerUserId.toString() !== userId.toString()) {
      throw new ForbiddenException('No tienes permisos para configurar los pagos de este club.');
    }

    const esPrimeraVez = !club.banco?.metodo;

    /* Se reemplaza en bloque, no se mezcla con lo anterior: al cambiar de
       método quedarían campos del método viejo (un tipoCuenta colgado de
       cuando era cuenta bancaria, por ejemplo). */
    club.banco = {
      metodo:     dto.metodo,
      titular:    dto.titular,
      documento:  dto.documento,
      banco:      dto.metodo === 'bancolombia' ? dto.banco : ETIQUETA_METODO[dto.metodo],
      tipoCuenta: dto.metodo === 'bancolombia' ? dto.tipoCuenta : undefined,
      numero:     dto.metodo === 'breb' ? undefined : dto.numero,
      llave:      dto.metodo === 'breb' ? dto.llave : undefined,
      tipoLlave:  dto.metodo === 'breb' ? dto.tipoLlave : undefined,
    };
    await club.save();

    /* El correo no puede tumbar el guardado: si Resend falla, la cuenta ya
       quedó registrada y lo único que se pierde es el aviso. */
    try {
      const dueno = await this.usersService.findById(club.ownerUserId.toString());
      await this.notificaciones.sendDatosBancariosActualizados({
        clubNombre: club.name,
        emailDueno: (dueno as any)?.email ?? club.contactEmail,
        esPrimeraVez,
        resumen: resumenBanco(club.banco),
      });
    } catch (e) {
      this.logger.warn(`No se pudo avisar el cambio de cuenta de ${club.name}: ${e?.message}`);
    }

    return {
      message: 'Cuenta de pagos actualizada',
      banco: club.banco,
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
      slogan: (club as any).slogan,
      schedule: (club as any).schedule,
      socialLinks: (club as any).socialLinks || {},
      photos: (club as any).photos || [],
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