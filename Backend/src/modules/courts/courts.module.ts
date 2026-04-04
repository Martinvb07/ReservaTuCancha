import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CourtsController } from './courts.controller';
import { CourtsService } from './courts.service';
import { Court, CourtSchema } from './schemas/court.schema';
import { BlockedSlot, BlockedSlotSchema } from './schemas/blocked-slot.schema';
import { Club, ClubSchema } from '../clubs/schemas/club.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Court.name, schema: CourtSchema },
      { name: BlockedSlot.name, schema: BlockedSlotSchema },
      { name: Club.name,  schema: ClubSchema  },
    ]),
    UsersModule,
  ],
  controllers: [CourtsController],
  providers: [CourtsService],
  exports: [CourtsService],
})
export class CourtsModule {}
