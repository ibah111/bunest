import 'colors';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { swaggerSetup } from './utils/swagger-setup';
import { DOCS_PATH } from './consts/application';
import { appConfig, type AppConfig, type AppRole } from './config';

export const node_env: string = process.env.NODE_ENV || 'development';

async function bootstrap() {
  const role = (process.env.APP_ROLE ?? 'api') as AppRole;
  if (role === 'consumer') {
    const app = await NestFactory.createApplicationContext(AppModule);
    const logger = new Logger(bootstrap.name);
    const settings = app.get<AppConfig>(appConfig.KEY);
    app.enableShutdownHooks();
    logger.log(`Application context started in ${settings.nodeEnv} mode`.green);
    return;
  }

  const app = await NestFactory.create(AppModule);
  const logger = new Logger(bootstrap.name);
  const settings = app.get<AppConfig>(appConfig.KEY);

  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  swaggerSetup(app);
  app.enableCors({
    origin: [
      `http://localhost:${settings.port}`,
      `http://127.0.0.1:${settings.port}`,
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition'],
  });
  await app.listen(settings.port, '0.0.0.0');

  switch (settings.nodeEnv) {
    case 'production':
      logger.error(`Application in ${settings.nodeEnv} mode`.red);
      break;
    default:
      logger.log(`Application in ${settings.nodeEnv} mode`.green);
      break;
  }
  console.log((await app.getUrl()) + DOCS_PATH);
}
bootstrap();
