import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { ClubsService } from './clubs.service';
import { ClubsController } from './clubs.controller';
import { Club, ClubSchema } from './schemas/club.schema';
import { Court, CourtSchema } from '../courts/schemas/court.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Club.name, schema: ClubSchema },
      { name: Court.name, schema: CourtSchema },
    ]),
  ],
  controllers: [ClubsController],
  providers: [ClubsService],
  exports: [MongooseModule, ClubsService],
})
export class ClubsModule {}
