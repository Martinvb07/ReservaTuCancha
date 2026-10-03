import { Module } from '@nestjs/common';
import { EpaycoService } from './epayco.service';

/* Las llaves de ePayco son de la empresa y salen del entorno, así que el
   servicio no depende de ningún modelo: cualquier módulo puede importarlo. */
@Module({
  providers: [EpaycoService],
  exports: [EpaycoService],
})
export class EpaycoModule {}
