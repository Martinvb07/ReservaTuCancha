// src/modules/changelog/changelog.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChangelogController } from './changelog.controller';
import { ChangelogService } from './changelog.service';
import { Changelog, ChangelogSchema } from './schemas/changelog.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Changelog.name, schema: ChangelogSchema }]),
    NotificationsModule,
  ],
  controllers: [ChangelogController],
  providers: [ChangelogService],
})
export class ChangelogModule {}