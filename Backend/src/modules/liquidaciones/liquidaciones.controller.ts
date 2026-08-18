import { Body, Controller, Delete, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LiquidacionesService } from './liquidaciones.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@ApiTags('Liquidaciones')
@Controller('liquidaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LiquidacionesController {
  constructor(private readonly liquidaciones: LiquidacionesService) {}

  /* ── Dueño del club ───────────────────────────────────────────────── */

  @Get('mias')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mis liquidaciones semanales' })
  mias(@Request() req) {
    return this.liquidaciones.misLiquidaciones(req.user.userId);
  }

  /* ── Admin ────────────────────────────────────────────────────────── */

  @Get('periodos')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Semanas disponibles para liquidar' })
  periodos() {
    return this.liquidaciones.periodos();
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cuánto se le debe girar a cada club en una semana' })
  resumen(@Query('inicio') inicio?: string) {
    return this.liquidaciones.resumen(inicio);
  }

  @Post('girar')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Marcar como girada la liquidación de un club' })
  girar(@Body() body: { ownerId: string; inicio: string; referencia?: string }) {
    return this.liquidaciones.girar(body.ownerId, body.inicio, body.referencia);
  }

  @Delete('girar')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Revertir un giro marcado por error' })
  revertir(@Query('ownerId') ownerId: string, @Query('inicio') inicio: string) {
    return this.liquidaciones.revertir(ownerId, inicio);
  }
}
