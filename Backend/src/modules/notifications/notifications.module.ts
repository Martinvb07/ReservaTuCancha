import { Module, forwardRef } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CourtsModule } from '../courts/courts.module';
import { ClubsModule } from '../clubs/clubs.module';

@Module({
  imports: [CourtsModule, ClubsModule],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
