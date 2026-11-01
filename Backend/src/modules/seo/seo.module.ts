import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeoController } from './seo.controller';
import { Court, CourtSchema } from '../courts/schemas/court.schema';
import { Club, ClubSchema } from '../clubs/schemas/club.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Court.name, schema: CourtSchema },
      { name: Club.name, schema: ClubSchema },
    ]),
  ],
  controllers: [SeoController],
})
export class SeoModule {}
