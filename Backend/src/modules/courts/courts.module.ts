import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CourtsController } from './courts.controller';
import { CourtsService } from './courts.service';
import { Court, CourtSchema } from './schemas/court.schema';
import { BlockedSlot, BlockedSlotSchema } from './schemas/blocked-slot.schema';
import { Club, ClubSchema } from '../clubs/schemas/club.schema';
import { UsersModule } from '../users/users.module';
import { WompiModule } from '../wompi/wompi.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Court.name, schema: CourtSchema },
      { name: BlockedSlot.name, schema: BlockedSlotSchema },
      { name: Club.name,  schema: ClubSchema  },
    ]),
    UsersModule,
    WompiModule,
  ],
  controllers: [CourtsController],
  providers: [CourtsService],
  exports: [CourtsService],
})
export class CourtsModule {}
