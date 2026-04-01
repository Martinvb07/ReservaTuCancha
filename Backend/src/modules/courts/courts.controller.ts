import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CourtsService, CourtFilters } from './courts.service';
import { CreateCourtDto } from './dto/create-court.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { SportType } from './schemas/court.schema';

@ApiTags('Canchas')
@Controller('courts')
export class CourtsController {
  constructor(private readonly courtsService: CourtsService) {}

  // ─── PUBLIC ───────────────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'Listar canchas con filtros (público)' })
  findAll(
    @Query('sport') sport?: SportType,
    @Query('city') city?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('ownerId') ownerId?: string,
  ) {
    const filters: CourtFilters = {
      sport,
      city,
      minPrice: minPrice ? +minPrice : undefined,
      maxPrice: maxPrice ? +maxPrice : undefined,
      page: page ? +page : 1,
      limit: limit ? +limit : 12,
      ownerId,
    };
    return this.courtsService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de cancha (público)' })
  findOne(@Param('id') id: string) {
    return this.courtsService.findById(id);
  }

  @Get(':id/wompi-config')
  @ApiOperation({ summary: 'Config de Wompi para la cancha (público)' })
  async getWompiConfig(@Param('id') courtId: string) {
    return this.courtsService.getWompiConfig(courtId);
  }

  // ─── OWNER ────────────────────────────────────────────────────────────
  @Get('owner/my-courts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mis canchas (propietario)' })
  findMyCourtss(@Request() req) {
    return this.courtsService.findByOwner(req.user.userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear cancha (propietario)' })
  create(@Request() req, @Body() dto: CreateCourtDto) {
    return this.courtsService.create(req.user.userId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar cancha' })
  update(@Param('id') id: string, @Request() req, @Body() dto: Partial<CreateCourtDto>) {
    return this.courtsService.update(id, req.user.userId, dto);
  }
}
