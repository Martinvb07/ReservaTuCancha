import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SolicitudesService } from './solicitudes.service';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { AprobarSolicitudDto } from './dto/aprobar-solicitud.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('solicitudes')
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  @Post()
  /* Cada solicitud manda correos. Sin freno es un grifo abierto contra la
     cuota de Resend. */
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  async create(@Body() body: CreateSolicitudDto) {
    await this.solicitudesService.crearSolicitud(body);
    return { message: 'Solicitud recibida' };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.solicitudesService.listarSolicitudes();
  }

  @Patch(':id/aprobar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async aprobar(
    @Param('id') id: string,
    @Body() approvalData?: AprobarSolicitudDto
  ) {
    return this.solicitudesService.aprobar(id, approvalData);
  }

  @Patch(':id/rechazar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async rechazar(@Param('id') id: string) {
    return this.solicitudesService.rechazar(id);
  }

  @Post(':id/reenviar-credenciales')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async reenviarCredenciales(@Param('id') id: string) {
    return this.solicitudesService.reenviarCredenciales(id);
  }
}