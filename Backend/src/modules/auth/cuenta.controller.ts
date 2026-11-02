import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CuentaService } from './cuenta.service';

class OlvideDto {
  @IsEmail()
  email: string;
}

class RestablecerDto {
  @IsString()
  @MaxLength(200)
  token: string;

  @IsString()
  @MaxLength(128)
  clave: string;
}

class CambiarClaveDto {
  @IsString()
  @MaxLength(128)
  actual: string;

  @IsString()
  @MaxLength(128)
  nueva: string;
}

class GoogleDto {
  @IsString()
  @MaxLength(4096)
  idToken: string;
}

@ApiTags('Cuenta')
@Controller('cuenta')
export class CuentaController {
  constructor(private readonly cuenta: CuentaService) {}

  @Post('olvide')
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @ApiOperation({ summary: 'Enviar el enlace para recuperar la contraseña' })
  olvide(@Body() dto: OlvideDto) {
    return this.cuenta.olvide(dto.email);
  }

  @Post('restablecer')
  @Throttle({ default: { limit: 10, ttl: 900000 } })
  @ApiOperation({ summary: 'Poner una contraseña nueva con el token del correo' })
  restablecer(@Body() dto: RestablecerDto) {
    return this.cuenta.restablecer(dto.token, dto.clave);
  }

  @Post('clave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 900000 } })
  @ApiOperation({ summary: 'Cambiar la contraseña desde el panel' })
  cambiarClave(@Request() req, @Body() dto: CambiarClaveDto) {
    return this.cuenta.cambiarClave(req.user.cuentaId ?? req.user.userId, dto.actual, dto.nueva);
  }

  @Get('google')
  @ApiOperation({ summary: '¿Está activo el ingreso con Google?' })
  googleActivo() {
    return { activo: this.cuenta.googleActivo };
  }

  @Post('google')
  @Throttle({ default: { limit: 10, ttl: 300000 } })
  @ApiOperation({ summary: 'Entrar al panel con una cuenta de Google' })
  google(@Body() dto: GoogleDto) {
    return this.cuenta.google(dto.idToken);
  }
}
