import { Global, Module } from '@nestjs/common';
import { CobrosService } from './cobros.service';

/* Las tarifas las necesitan reservas, canchas, el split y los correos.
   Es un servicio sin estado que solo lee el entorno, asi que se expone global
   en vez de importarlo en media docena de modulos. */
@Global()
@Module({
  providers: [CobrosService],
  exports: [CobrosService],
})
export class CobrosModule {}
