import { 
  Controller, 
  Get, 
  Query, 
  Patch, 
  Param, 
  Body, 
  UseGuards, 
  Request 
} from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Get('my-club')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  async getMyClub(@Request() req) {
    return this.clubsService.findMyClub(req.user.userId);
  }

  @Get('my-club/ensure-slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  async ensureMySlug(@Request() req) {
    const club = await this.clubsService.findMyClub(req.user.userId);
    if (!club) throw new Error('Club no encontrado');
    return this.clubsService.ensureSlug(club._id.toString());
  }

  @Get('slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.clubsService.findBySlug(slug);
  }

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
    @Body() wompiData: { wompiPublicKey: string; wompiIntegritySecret?: string; wompiEventsSecret?: string },
    @Request() req
  ) {
    return this.clubsService.updateWompiCredentials(clubId, wompiData, req.user.userId);
  }
}