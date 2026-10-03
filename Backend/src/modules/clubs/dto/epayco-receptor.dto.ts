import { IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Id del club como receptor en pagos divididos de ePayco.
 *
 * Es el P_CUST_ID_CLIENTE que el club ve en su propia cuenta de ePayco, un
 * número corto. Se valida el formato acá porque un id mal copiado no falla al
 * guardarlo sino en el primer cobro, y para entonces el jugador ya está en el
 * checkout.
 */
export class EpaycoReceptorDto {
  @ApiProperty({ example: '1234567' })
  @IsString()
  @MaxLength(32)
  @Matches(/^\d{3,32}$/, {
    message: 'El ID de ePayco son solo números (lo encuentras en tu cuenta de ePayco)',
  })
  epaycoReceptorId: string;
}
