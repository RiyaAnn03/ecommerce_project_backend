import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { AppException } from './common/errors/app.exception';
import { ErrorCode } from './common/errors/error-codes';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Allow frontend (React/Next/Vite) to call this API from another port/origin.
  app.enableCors({
    origin: process.env.FRONTEND_URL?.split(',').map((o) => o.trim()) ?? true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const message = errors
          .flatMap((e) => Object.values(e.constraints ?? {}))
          .join(', ');
        return new AppException(
          400,
          ErrorCode.VALIDATION_FAILED,
          message || 'Validation failed',
        );
      },
    }),
  );
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
