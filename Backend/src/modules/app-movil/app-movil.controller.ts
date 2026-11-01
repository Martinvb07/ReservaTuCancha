import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation } from '@nestjs/swagger';

const TIENDA_ANDROID =
  'https://play.google.com/store/apps/details?id=site.reservatucancha.reservatucancha';

/**
 * Lo que la app consulta al abrirse para saber si está al día.
 *
 * `minima` obliga a actualizar (por ejemplo, después de un cambio en pagos
 * que las versiones viejas no entienden); `ultima` solo la sugiere. Las dos
 * viven en el entorno para subirlas sin desplegar código.
 */
@Controller('app')
export class AppMovilController {
  constructor(private readonly config: ConfigService) {}

  @Get('version')
  @ApiOperation({ summary: 'Versión mínima y última de la app móvil (público)' })
  version() {
    const minima = this.config.get<string>('APP_VERSION_MINIMA') || '1.0.0';
    const ultima = this.config.get<string>('APP_VERSION_ULTIMA') || minima;
    return {
      minima,
      ultima,
      tienda: this.config.get<string>('APP_TIENDA_URL') || TIENDA_ANDROID,
    };
  }
}
