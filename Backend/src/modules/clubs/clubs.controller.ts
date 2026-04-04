import {
  Controller,
  Get,
  Post,
  Delete,
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

  @Patch('my-club/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  async updateProfile(@Request() req, @Body() body: {
    name?: string; description?: string; address?: string;
    city?: string; contactPhone?: string; contactEmail?: string; logo?: string;
  }) {
    return this.clubsService.updateProfile(req.user.userId, body);
  }

  @Post('my-club/photos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  async addClubPhoto(@Request() req, @Body('url') url: string) {
    return this.clubsService.addClubPhoto(req.user.userId, url);
  }

  @Delete('my-club/photos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  async removeClubPhoto(@Request() req, @Body('url') url: string) {
    return this.clubsService.removeClubPhoto(req.user.userId, url);
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