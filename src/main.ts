import 'colors';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { swaggerSetup } from './utils/swagger-setup';
import { DOCS_PATH } from './consts/application';

export const node_env: string = process.env.NODE_ENV || 'development';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger(bootstrap.name);
  const PORT = process.env.PORT ?? 3000;

  swaggerSetup(app);

  await app.listen(PORT);

  switch (node_env) {
    case 'production':
      logger.error(`Application in ${node_env} mode`.red);
      break;
    default:
      logger.log(`Application in ${node_env} mode`.green);
      break;
  }
  console.log((await app.getUrl()) + DOCS_PATH);
}
bootstrap();
