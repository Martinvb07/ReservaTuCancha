import { Module } from '@nestjs/common';
import { WompiService } from './wompi.service';

/* Las llaves de Wompi son de la empresa y salen del entorno, así que el
   servicio no depende de ningún modelo: cualquier módulo puede importarlo. */
@Module({
  providers: [WompiService],
  exports: [WompiService],
})
export class WompiModule {}
