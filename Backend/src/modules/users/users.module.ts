// src/modules/users/users.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PlanLimitsService } from './plan-limits.service';
import { User, UserSchema } from './schemas/user.schema';
import { Court, CourtSchema } from '../courts/schemas/court.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name,  schema: UserSchema  },
      { name: Court.name, schema: CourtSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, PlanLimitsService],
  exports: [UsersService, PlanLimitsService],
})
export class UsersModule {}