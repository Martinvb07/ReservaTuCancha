import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Club, ClubSchema } from '../clubs/schemas/club.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { EquipoController } from './equipo.controller';
import { EquipoService } from './equipo.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Club.name, schema: ClubSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [EquipoController],
  providers: [EquipoService],
})
export class EquipoModule {}
