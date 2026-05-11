import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: false });

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
  app.useStaticAssets(join(process.cwd(), 'frontend-build'));

  // SPA catch-all: serve index.html for all non-API routes (React Router)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use((req: any, res: any, next: any) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(join(process.cwd(), 'frontend-build', 'index.html'));
  });

  const port = parseInt(process.env.PORT || '3001');
  await app.listen(port);
  console.log(`Traxlogi API running on http://localhost:${port}/api`);
  console.log(`Traxlogi Frontend running on http://localhost:${port}`);
  console.log(`JT808 TCP Server on port ${process.env.TCP_PORT || 8808}`);
}
bootstrap();
