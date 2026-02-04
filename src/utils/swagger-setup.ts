import { DOCS_PATH } from '@/consts/application';
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Request, Response, NextFunction } from 'express';


export function swaggerSetup(app: INestApplication): void {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const path = req.path ?? req.originalUrl ?? '';
    if (path.startsWith(DOCS_PATH)) {
      const ua = req.get('User-Agent') ?? req.headers['user-agent'] ?? 'unknown';
      console.log(`${req.method} ${path} | User-Agent: ${ua}`);
    }
    next();
  });

  const config = new DocumentBuilder()
    .setTitle('Test fot tips')
    .setDescription('Tips microservice')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(DOCS_PATH, app, document, {
    swaggerOptions: { persistAuthorization: true },
    useGlobalPrefix: true
  });
}
