import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSubscriptionDto {
  @ApiProperty({ enum: ['basico', 'pro', 'empresarial'] })
  @IsIn(['basico', 'pro', 'empresarial'])
  plan: string;

  @ApiProperty({ enum: ['activa', 'trial', 'vencida', 'cancelada'] })
  @IsIn(['activa', 'trial', 'vencida', 'cancelada'])
  estado: string;
}
