import { Controller, Get, Query, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Get()
  async getClubsBySport(
    @Query('deporte') deporte: string,
    @Query('ciudad') ciudad: string
  ) {
    return this.clubsService.findClubsBySportAndCity(deporte, ciudad);
  }

  @Patch(':id/wompi')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  async updateWompiCredentials(
    @Param('id') clubId: string,
    @Body() wompiData: { wompiMerchantId: string; wompiPublicKey: string; wompiApiKey: string },
    @Request() req
  ) {
    return this.clubsService.updateWompiCredentials(clubId, wompiData, req.user.userId);
  }
}