import {
  Controller, Post, Get, Patch, Delete, Body, Query,
  Param, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ReprogramarBookingDto } from './dto/reprogramar-booking.dto';
import { ReservaManualDto } from './dto/reserva-manual.dto';
import { ListaEsperaDto } from './dto/lista-espera.dto';
import { ListaEsperaService } from './lista-espera.service';
import { PanelClubService } from './panel-club.service';
import { BloquearClienteDto, NoShowDto } from './dto/panel-club.dto';
import { CajaTurnoService } from './caja-turno.service';
import { AbrirCajaDto, CerrarCajaDto, MovimientoCajaDto } from './dto/caja-turno.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SoloTitularGuard } from '../../common/guards/solo-titular.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@ApiTags('Reservas')
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly listaEspera: ListaEsperaService,
    private readonly panelClub: PanelClubService,
    private readonly cajaTurno: CajaTurnoService,
  ) {}

  @Get('public')
  /* Buscar por correo no devuelve el cancelToken (ver booking.schema): con el
     bastaba saber el correo de alguien para moverle el turno. Por codigo si,
     porque el codigo solo lo tiene quien reservo. */
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Reservas por email o código de reserva (público)' })
  getByEmailPublic(
    @Query('guestEmail') guestEmail?: string,
    @Query('code') code?: string,
  ) {
    if (code?.trim()) return this.bookingsService.findByBookingCode(code);
    if (guestEmail?.trim()) return this.bookingsService.findByGuestEmail(guestEmail);
    return [];
  }

  @Post()
  @Throttle({ default: { limit: 10, ttl: 600000 } })
  @ApiOperation({ summary: 'Crear reserva (sin login)' })
  create(@Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto);
  }

  @Post('lista-espera')
  @Throttle({ default: { limit: 10, ttl: 600000 } })
  @ApiOperation({ summary: 'Pedir aviso si un turno ocupado se libera (sin login)' })
  unirseListaEspera(@Body() dto: ListaEsperaDto) {
    return this.listaEspera.unirse(dto);
  }

  @Post('manual')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'El club anota una reserva tomada por teléfono o en el mostrador' })
  crearManual(@Body() dto: ReservaManualDto, @Request() req) {
    return this.bookingsService.crearManual(req.user.userId, dto);
  }

  @Delete('manual/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Anular una reserva anotada por el club (?serie=1: también las siguientes)' })
  anularManual(@Param('id') id: string, @Query('serie') serie: string, @Request() req) {
    return this.bookingsService.anularManual(req.user.userId, id, serie === '1' || serie === 'true');
  }

  @Post('reprogramar')
  @ApiOperation({ summary: 'Mover una reserva de horario (sin login, con el token del email)' })
  reprogramarByToken(
    @Query('token') token: string,
    @Body() body: ReprogramarBookingDto,
  ) {
    return this.bookingsService.reprogramarByToken(token, body);
  }

  @Get('cancel-info')
  @ApiOperation({ summary: 'Info de reserva por cancelToken (sin login)' })
  getCancelInfo(@Query('token') token: string) {
    return this.bookingsService.findByCancelToken(token);
  }

  /* Cuántos turnos quedan libres en varias canchas a la vez, para pintarlo
     en las tarjetas del listado sin abrir cada ficha. */
  @Get('disponibilidad')
  @ApiOperation({ summary: 'Turnos libres por cancha en una fecha (público)' })
  getDisponibilidad(
    @Query('ids') ids: string,
    @Query('fecha') fecha: string,
    @Query('desde') desde?: string,
  ) {
    return this.bookingsService.disponibilidad(
      String(ids ?? '').split(',').map((s) => s.trim()).filter(Boolean),
      fecha,
      desde,
    );
  }

  @Get('slots')
  @ApiOperation({ summary: 'Horarios ocupados' })
  getSlots(@Query('courtId') courtId: string, @Query('date') date: string) {
    return this.bookingsService.findByCourtAndDate(courtId, date);
  }

  // ─── Panel del club: clientes, no llegó y caja ───────────────────────

  @Get('owner/clientes')
  /* Con plata de por medio: solo el dueño, no su equipo. */
  @UseGuards(JwtAuthGuard, RolesGuard, SoloTitularGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clientes del club: frecuencia, gasto y faltas' })
  clientes(@Request() req) {
    return this.panelClub.clientes(req.user.userId);
  }

  @Post('owner/clientes/bloqueos')
  /* Con plata de por medio: solo el dueño, no su equipo. */
  @UseGuards(JwtAuthGuard, RolesGuard, SoloTitularGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dejar de recibirle reservas en línea a un cliente' })
  bloquearCliente(@Body() dto: BloquearClienteDto, @Request() req) {
    return this.panelClub.bloquear(req.user.userId, dto);
  }

  @Delete('owner/clientes/bloqueos/:id')
  /* Con plata de por medio: solo el dueño, no su equipo. */
  @UseGuards(JwtAuthGuard, RolesGuard, SoloTitularGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Quitar el bloqueo de un cliente' })
  desbloquearCliente(@Param('id') id: string, @Request() req) {
    return this.panelClub.desbloquear(req.user.userId, id);
  }

  @Get('owner/caja')
  /* Con plata de por medio: solo el dueño, no su equipo. */
  @UseGuards(JwtAuthGuard, RolesGuard, SoloTitularGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Caja del club entre dos fechas (YYYY-MM-DD)' })
  caja(@Query('desde') desde: string, @Query('hasta') hasta: string, @Request() req) {
    return this.panelClub.caja(req.user.userId, String(desde ?? ''), String(hasta ?? desde ?? ''));
  }

  // ─── Turno de caja: lo abre y lo cierra quien atiende, recepción incluida ──

  @Get('owner/caja/turno')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'La caja abierta con su resumen en vivo (o null)' })
  async cajaActual(@Request() req) {
    return (await this.cajaTurno.actual(req.user.userId)) ?? { turno: null, resumen: null };
  }

  @Post('owner/caja/turno/abrir')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Abrir la caja con una base en efectivo' })
  abrirCaja(@Body() dto: AbrirCajaDto, @Request() req) {
    return this.cajaTurno.abrir(req.user.userId, dto.base, req.user.name ?? 'Equipo');
  }

  @Post('owner/caja/turno/movimientos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar un ingreso o un gasto en la caja abierta' })
  movimientoCaja(@Body() dto: MovimientoCajaDto, @Request() req) {
    return this.cajaTurno.movimiento(req.user.userId, dto, req.user.name ?? 'Equipo');
  }

  @Delete('owner/caja/turno/movimientos/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Quitar un movimiento de la caja abierta' })
  quitarMovimientoCaja(@Param('id') id: string, @Request() req) {
    return this.cajaTurno.quitarMovimiento(req.user.userId, id);
  }

  @Post('owner/caja/turno/cerrar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar la caja: cuenta el efectivo y le llega el cierre al dueño' })
  cerrarCaja(@Body() dto: CerrarCajaDto, @Request() req) {
    return this.cajaTurno.cerrar(req.user.userId, dto, req.user.name ?? 'Equipo');
  }

  @Get('owner/caja/cierres')
  /* El historial de cierres es del dueño; el equipo solo ve la caja abierta. */
  @UseGuards(JwtAuthGuard, RolesGuard, SoloTitularGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Historial de cierres de caja' })
  cierresCaja(@Request() req) {
    return this.cajaTurno.historial(req.user.userId);
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

  @Patch(':id/no-show')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar o desmarcar que el cliente no llegó' })
  marcarNoShow(@Param('id') id: string, @Body() dto: NoShowDto, @Request() req) {
    return this.panelClub.marcarNoShow(req.user.userId, id, dto.noShow);
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
  @ApiOperation({ summary: 'Abrir el checkout de ePayco' })
  async initPayment(
    @Param('id') bookingId: string,
    @Body() body: { redirectUrl: string },
    @Request() req,
  ) {
    /* ePayco pide la IP del comprador para su antifraude. Detrás de nginx la
       real llega en X-Forwarded-For, que es lo que resuelve req.ip. */
    return this.bookingsService.initPayment(bookingId, body.redirectUrl, req.ip);
  }
}