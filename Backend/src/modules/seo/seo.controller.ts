import { Controller, Get } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Model } from 'mongoose';
import { Court, CourtDocument } from '../courts/schemas/court.schema';
import { Club, ClubDocument } from '../clubs/schemas/club.schema';

/**
 * Lo que el sitemap de la web necesita para listar las páginas públicas.
 *
 * Una sola consulta liviana: solo identificadores y fecha de cambio. Las
 * canchas inactivas no se listan, porque su ficha responde 404.
 */
@ApiTags('SEO')
@Controller('seo')
export class SeoController {
  constructor(
    @InjectModel(Court.name) private readonly courtModel: Model<CourtDocument>,
    @InjectModel(Club.name) private readonly clubModel: Model<ClubDocument>,
  ) {}

  @Get('sitemap')
  @ApiOperation({ summary: 'Canchas y clubes públicos para el sitemap (público)' })
  async sitemap() {
    const [canchas, clubes] = await Promise.all([
      this.courtModel.find({ isActive: true }).select('_id updatedAt').limit(5000).lean(),
      this.clubModel
        .find({ slug: { $exists: true, $ne: '' } })
        .select('slug updatedAt')
        .limit(5000)
        .lean(),
    ]);
    return {
      canchas: canchas.map((c: any) => ({ id: String(c._id), actualizado: c.updatedAt ?? null })),
      clubes: clubes.map((c: any) => ({ slug: c.slug, actualizado: c.updatedAt ?? null })),
    };
  }
}
