import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 0. HELMET: Headers de seguridad HTTP
  app.use(helmet());

  // 1. TRUST PROXY: Vital para que NestJS sepa que Nginx está manejando el SSL
  const instance = app.getHttpAdapter().getInstance();
  if (typeof instance.set === 'function') {
    instance.set('trust proxy', 1);
  }

  // 2. GLOBAL PREFIX: Se mantiene igual
  app.setGlobalPrefix('api');

  // 3. CORS: Configuración explícita para producción
  app.enableCors({
    origin: [
      'https://reservatucancha.site',
      'https://www.reservatucancha.site',
      'http://localhost:3000' // Por si pruebas algo local
    ],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // 4. GLOBAL VALIDATION PIPE
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 5. SWAGGER DOCS
  const config = new DocumentBuilder()
    .setTitle('ReservaTuCancha API')
    .setDescription('API para reserva de canchas deportivas — Fútbol, Pádel, Voley Playa')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // WebSocket adapter para Socket.io
  app.useWebSocketAdapter(new IoAdapter(app));

  const port = process.env.PORT || 4000;
  await app.listen(port);
  
  console.log(`🚀 API corriendo en puerto: ${port}`);
}
bootstrap();
