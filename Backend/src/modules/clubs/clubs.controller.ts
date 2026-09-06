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
import { DatosBancariosDto } from './dto/datos-bancarios.dto';
import { UpdateClubProfileDto } from './dto/update-club-profile.dto';
import { PhotoDto } from '../courts/dto/photo.dto';
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
  async updateProfile(@Request() req, @Body() body: UpdateClubProfileDto) {
    return this.clubsService.updateProfile(req.user.userId, body);
  }

  @Post('my-club/photos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  async addClubPhoto(@Request() req, @Body() dto: PhotoDto) {
    return this.clubsService.addClubPhoto(req.user.userId, dto.url);
  }

  @Delete('my-club/photos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  async removeClubPhoto(@Request() req, @Body() dto: PhotoDto) {
    return this.clubsService.removeClubPhoto(req.user.userId, dto.url);
  }

  @Patch(':id/banco')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  async updateDatosBancarios(
    @Param('id') clubId: string,
    @Body() dto: DatosBancariosDto,
    @Request() req,
  ) {
    return this.clubsService.updateDatosBancarios(clubId, dto, req.user.userId);
  }
}