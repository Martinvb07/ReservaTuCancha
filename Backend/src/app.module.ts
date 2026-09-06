// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CourtsModule } from './modules/courts/courts.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { DatabaseModule } from './database/database.module';
import { SolicitudesModule } from './modules/solicitudes/solicitudes.module';
import { ClubsModule } from './modules/clubs/clubs.module';
import { LiquidacionesModule } from './modules/liquidaciones/liquidaciones.module';
import { ChangelogModule } from './modules/changelog/changelog.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    /* Un solo throttler con nombre: si se declara mas de uno aca, todos
       aplican a todas las rutas. Los limites finos van por ruta con
       @Throttle({ default: { ... } }). */
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    UsersModule,
    CourtsModule,
    BookingsModule,
    PaymentsModule,
    ReviewsModule,
    NotificationsModule,
    AnalyticsModule,
    SolicitudesModule,
    ClubsModule,
    ChangelogModule,   // ← nuevo
    LiquidacionesModule,
  ],
  providers: [
    /* Sin este provider el ThrottlerModule no hace nada: estaba importado pero
       nunca registrado, asi que /api/auth/login aceptaba intentos ilimitados. */
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}