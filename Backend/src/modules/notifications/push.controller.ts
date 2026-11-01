import { Body, Controller, Delete, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { PushService } from './push.service';

class DispositivoDto {
  @IsString()
  @MinLength(20)
  @MaxLength(4096)
  token: string;

  @IsOptional()
  @IsIn(['android', 'ios', 'web'])
  plataforma?: string;
}

/** Teléfonos del club que reciben avisos push. */
@ApiTags('Push')
@Controller('push/dispositivos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
@ApiBearerAuth()
export class PushController {
  constructor(private readonly push: PushService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar el teléfono para recibir avisos del club' })
  registrar(@Request() req, @Body() dto: DispositivoDto) {
    return this.push.registrar({
      token: dto.token,
      plataforma: dto.plataforma,
      ownerId: req.user.userId,
      cuentaId: req.user.cuentaId,
    });
  }

  @Delete()
  @ApiOperation({ summary: 'Dejar de recibir avisos en este teléfono (al cerrar sesión)' })
  olvidar(@Body() dto: DispositivoDto) {
    return this.push.olvidar(dto.token);
  }
}
