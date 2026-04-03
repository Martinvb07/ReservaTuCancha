import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from './schemas/user.schema';

@ApiTags('Usuarios')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('my-plan')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Plan de suscripción del owner autenticado' })
  getMyPlan(@Request() req) {
    return this.usersService.getMyPlan(req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los usuarios' })
  findAll() {
    return this.usersService.findAll();
  }

  @Post('register')
  @ApiOperation({ summary: 'Crear usuario (admin)' })
  register(@Body() body: { name: string; email: string; phone?: string; role: string; password: string }) {
    return this.usersService.createUser(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar usuario' })
  update(@Param('id') id: string, @Body() body: { name?: string; phone?: string; role?: string; password?: string }) {
    return this.usersService.updateUser(id, body);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Activar / desactivar usuario' })
  toggleStatus(@Param('id') id: string) {
    return this.usersService.toggleStatus(id);
  }

  @Patch(':id/subscription')
  @ApiOperation({ summary: 'Cambiar plan de suscripción' })
  updateSubscription(@Param('id') id: string, @Body() body: { plan: string; estado: string }) {
    return this.usersService.updateSubscription(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar usuario' })
  remove(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}