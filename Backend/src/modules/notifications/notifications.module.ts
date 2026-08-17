import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { RemindersCron } from './reminders.cron';
import { CourtsModule } from '../courts/courts.module';
import { ClubsModule } from '../clubs/clubs.module';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    CourtsModule,
    ClubsModule,
    /* El schema de User se registra directo (en vez de importar UsersModule)
       para poder buscar los propietarios del changelog sin crear un ciclo
       entre módulos. */
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: User.name, schema: UserSchema },
    ]),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [NotificationsService, NotificationsGateway, RemindersCron],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
