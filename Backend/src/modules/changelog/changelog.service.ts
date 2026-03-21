// src/modules/changelog/changelog.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Changelog, ChangelogDocument } from './schemas/changelog.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ChangelogService {
  constructor(
    @InjectModel(Changelog.name) private changelogModel: Model<ChangelogDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll() {
    return this.changelogModel.find().sort({ createdAt: -1 }).lean();
  }

  async create(data: { titulo: string; descripcion: string; version?: string; tag: string; destinatarios: string }) {
    const entry = new this.changelogModel(data);
    const saved = await entry.save();

    // Notificar a propietarios por email
    await this.notificationsService.sendChangelogNotification(
      data.titulo,
      data.descripcion,
      data.version,
    );

    return saved;
  }
}