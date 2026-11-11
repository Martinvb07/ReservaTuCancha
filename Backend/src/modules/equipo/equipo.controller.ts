import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SoloTitularGuard } from '../../common/guards/solo-titular.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { EquipoService } from './equipo.service';

class InvitarDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  /** encargado: casi todo. recepcion: solo reservas y bloqueos. */
  @IsOptional()
  @IsIn(['encargado', 'recepcion'])
  rol?: 'encargado' | 'recepcion';
}

class RolDto {
  @IsIn(['encargado', 'recepcion'])
  rol: 'encargado' | 'recepcion';
}

class AccesoDto {
  @IsBoolean()
  activo: boolean;
}

@ApiTags('Equipo')
@Controller('equipo')
@UseGuards(JwtAuthGuard, RolesGuard, SoloTitularGuard)
@Roles(UserRole.OWNER)
@ApiBearerAuth()
export class EquipoController {
  constructor(private readonly equipo: EquipoService) {}

  @Get()
  @ApiOperation({ summary: 'Empleados con acceso al panel del club' })
  listar(@Request() req) {
    return this.equipo.listar(req.user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Dar acceso a un empleado (le llega la clave por correo)' })
  invitar(@Request() req, @Body() dto: InvitarDto) {
    return this.equipo.invitar(req.user.userId, dto);
  }

  @Patch(':id/acceso')
  @ApiOperation({ summary: 'Pausar o reactivar el acceso de un empleado' })
  acceso(@Request() req, @Param('id') id: string, @Body() dto: AccesoDto) {
    return this.equipo.cambiarAcceso(req.user.userId, id, dto.activo);
  }

  @Patch(':id/rol')
  @ApiOperation({ summary: 'Cambiar el rol de un empleado (encargado o recepción)' })
  rol(@Request() req, @Param('id') id: string, @Body() dto: RolDto) {
    return this.equipo.cambiarRol(req.user.userId, id, dto.rol);
  }

  @Post(':id/clave')
  @ApiOperation({ summary: 'Generar y enviar una clave nueva' })
  clave(@Request() req, @Param('id') id: string) {
    return this.equipo.nuevaClave(req.user.userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Quitar a un empleado del equipo' })
  quitar(@Request() req, @Param('id') id: string) {
    return this.equipo.quitar(req.user.userId, id);
  }
}
