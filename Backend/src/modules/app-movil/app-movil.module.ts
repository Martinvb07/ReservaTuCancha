import { Module } from '@nestjs/common';
import { AppMovilController } from './app-movil.controller';

@Module({ controllers: [AppMovilController] })
export class AppMovilModule {}
