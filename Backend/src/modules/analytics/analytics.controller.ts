import { Controller, Get, UseGuards, Request } from '@nestjs/common';
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
  @ApiOperation({ summary: 'Ingresos mensuales globales' })
  getAdminMonthly() {
    return this.analyticsService.getMonthlyRevenue();
  }
}
