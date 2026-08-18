// src/modules/changelog/changelog.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Changelog, ChangelogDocument } from './schemas/changelog.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateChangelogDto } from './dto/create-changelog.dto';
import {
  bumpVersion,
  compareVersions,
  formatVersion,
  highestVersion,
  normalizeVersion,
  parseVersion,
  TAG_BUMP,
  type BumpKind,
  type SemVer,
} from './version.util';

@Injectable()
export class ChangelogService {
  constructor(
    @InjectModel(Changelog.name) private changelogModel: Model<ChangelogDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll() {
    return this.changelogModel.find().sort({ createdAt: -1 }).lean();
  }

  /** Versión más alta ya publicada. Son pocas entradas: se comparan en memoria. */
  private async ultimaVersion(): Promise<SemVer | null> {
    const previas = await this.changelogModel.find().select('version').lean();
    return highestVersion(previas.map((p) => p.version));
  }

  /**
   * Qué versión toca según el tipo de cambio. El formulario de admin la
   * propone para que nadie tenga que acordarse de cuál fue la última.
   */
  async nextVersion(tag?: string) {
    const ultima = await this.ultimaVersion();
    const salto: BumpKind = TAG_BUMP[tag ?? ''] ?? 'minor';
    return {
      ultima: ultima ? formatVersion(ultima) : null,
      sugerida: bumpVersion(ultima, salto),
      salto,
    };
  }

  async create(dto: CreateChangelogDto) {
    const version = await this.validarVersion(dto.version, dto.tag);

    const entry = new this.changelogModel({ ...dto, version });
    const saved = await entry.save();

    /* Notificar a los propietarios. Si el correo falla, la publicación ya quedó
       guardada: se informa el conteo real para no decir "enviado" a ciegas. */
    const envio = await this.notificationsService.sendChangelogNotification(
      dto.titulo,
      dto.descripcion,
      version,
      dto.destinatarios,
    );

    return { ...saved.toObject(), envio };
  }

  /**
   * Normaliza la versión a X.Y.Z y exige que avance sobre la última publicada.
   * Publicar 2.1 después de 2.1.1 es casi siempre un dedazo, y el correo ya
   * salió cuando alguien lo nota.
   */
  private async validarVersion(raw: string | undefined, tag: string): Promise<string | undefined> {
    if (!raw) return undefined;

    const version = normalizeVersion(raw);
    if (!version) {
      throw new BadRequestException('La versión debe verse como 2.2.0 (también sirve 2.2)');
    }

    const ultima = await this.ultimaVersion();
    if (ultima && compareVersions(parseVersion(version)!, ultima) <= 0) {
      const sugerida = bumpVersion(ultima, TAG_BUMP[tag] ?? 'minor');
      throw new BadRequestException(
        `La versión ${version} no avanza sobre la última publicada (${formatVersion(ultima)}). ` +
          `Para este tipo de cambio corresponde ${sugerida}.`,
      );
    }

    return version;
  }
}
