import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('public')
  @ApiOperation({ summary: 'Stats públicas para la landing page' })
  getPublicStats() {
    return this.analyticsService.getPublicStats();
  }

  @Get('owner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Stats del propietario' })
  getOwnerStats(@Request() req) {
    return this.analyticsService.getOwnerStats(req.user.userId);
  }

  @Get('owner/monthly')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Ingresos mensuales del propietario' })
  getOwnerMonthly(@Request() req) {
    return this.analyticsService.getMonthlyRevenue(req.user.userId);
  }

  @Get('owner/ocupacion')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Ocupación por día y hora (?semanas=8&courtId=)' })
  getOcupacion(@Request() req, @Query('semanas') semanas?: string, @Query('courtId') courtId?: string) {
    return this.analyticsService.getOcupacion(req.user.userId, Number(semanas) || 8, courtId);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Stats globales (admin)' })
  getAdminStats() {
    return this.analyticsService.getAdminStats();
  }

  @Get('admin/monthly')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Nuevos propietarios por mes (SaaS)' })
  getAdminMonthly() {
    return this.analyticsService.getMonthlyNewOwners();
  }
}
