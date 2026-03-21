import { Controller, Get, Query } from '@nestjs/common';
import { ClubsService } from './clubs.service';

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
}
