import {
  Controller, Post, Get, Patch, Body, Query,
  Param, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@ApiTags('Reservas')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('public')
  @ApiOperation({ summary: 'Reservas por email (público)' })
  getByEmailPublic(@Query('guestEmail') guestEmail: string) {
    return this.bookingsService.findByGuestEmail(guestEmail);
  }

  @Post()
  @ApiOperation({ summary: 'Crear reserva (sin login)' })
  create(@Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto);
  }

  @Get('cancel')
  @ApiOperation({ summary: 'Cancelar reserva con token' })
  cancelByToken(@Query('token') token: string) {
    return this.bookingsService.cancelByToken(token);
  }

  @Get('cancel-info')
  @ApiOperation({ summary: 'Info de reserva por cancelToken (sin login)' })
  getCancelInfo(@Query('token') token: string) {
    return this.bookingsService.findByCancelToken(token);
  }

  @Get('slots')
  @ApiOperation({ summary: 'Horarios ocupados' })
  getSlots(@Query('courtId') courtId: string, @Query('date') date: string) {
    return this.bookingsService.findByCourtAndDate(courtId, date);
  }

  @Get('owner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  findByOwner(@Request() req) {
    return this.bookingsService.findByOwnerId(req.user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Todas las reservas (admin) — soporta ?guestEmail=X' })
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('guestEmail') guestEmail?: string,
  ) {
    return this.bookingsService.findAll(+page, +limit, guestEmail);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una reserva por ID' })
  findOne(@Param('id') id: string) {
    return this.bookingsService.findById(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar estado de reserva (owner/admin)' })
  updateStatus(@Param('id') id: string, @Body('status') status: string, @Request() req) {
    return this.bookingsService.updateStatus(id, { status }, req.user.userId, req.user.role);
  }

  @Post(':id/payment')
  @ApiOperation({ summary: 'Iniciar pago con Wompi' })
  async initPayment(
    @Param('id') bookingId: string,
    @Body() body: { redirectUrl: string },
  ) {
    return this.bookingsService.initPayment(bookingId, body.redirectUrl);
  }
}