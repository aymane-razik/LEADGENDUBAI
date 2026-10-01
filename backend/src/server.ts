import 'reflect-metadata';
import compression from 'compression';
import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { connectDatabase, connectRedis, disconnectDatabase, disconnectRedis, env } from './config';
import { createLegacyApi } from './legacy-api';
import { closeQueue } from './queues/registry';
import { scheduler } from './workers/scheduler';
import { logger } from './utils';
import { registerWebhookEventDelivery } from './webhooks/events';
import { cookieCsrfProtection } from './security/cookie-csrf';

const startServer = async (): Promise<void> => {
  await connectDatabase();
  await connectRedis();
  registerWebhookEventDelivery();

  const app = await NestFactory.create(AppModule, { bufferLogs: true, bodyParser: false });
  app.useLogger(false);
  app.use(helmet());
  app.use(compression());
  app.use(cookieCsrfProtection);
  app.enableCors({ origin: env.FRONTEND_URL, credentials: true });
  app.use('/api/v1', createLegacyApi());
  if (env.NODE_ENV !== 'production') {
    const openApi = SwaggerModule.createDocument(app, new DocumentBuilder()
      .setTitle('Dubai LeadGen API')
      .setDescription('Versioned API. NestJS endpoints are under /api/v2; legacy Express routes remain under /api/v1.')
      .setVersion('2.0.0')
      .addBearerAuth()
      .build());
    SwaggerModule.setup('api/docs', app, openApi);
  }
  await scheduler.start();
  await app.listen(env.PORT);
  logger.info('NestJS API started', { port: env.PORT, legacyApi: '/api/v1', nativeApi: '/api/v2' });

  let shuttingDown = false;
  const gracefulShutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info('Shutting down API', { signal });
    await scheduler.stop();
    await app.close();
    await closeQueue();
    await Promise.all([disconnectDatabase(), disconnectRedis()]);
    process.exit(0);
  };
  process.on('SIGINT', () => void gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
};

void startServer().catch((error: unknown) => {
  logger.error('Server startup failed', { error });
  process.exit(1);
});
