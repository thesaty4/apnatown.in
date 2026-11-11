import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Server } from 'node:http';
import { AppModule } from './app.module';
import type { RuntimeConfig } from './shared/config/config';
import { configureHttp } from './shared/http/security';
import { createLogger, NestLogger } from './shared/logger/logger';
import { shutdownHandler } from './shared/lifecycle';

export async function createApplication(config: RuntimeConfig) {
  const logger = createLogger(config.LOG_LEVEL);
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule.forRoot(config),
    {
      logger: new NestLogger(logger),
      rawBody: true,
      bodyParser: false,
      abortOnError: false,
    },
  );
  configureHttp(app, config, logger);
  await app.init();
  const server = app.getHttpServer() as Server;
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.keepAliveTimeout = 5000;
  return {
    app,
    logger,
    shutdown: shutdownHandler(app, server, config.SHUTDOWN_TIMEOUT_MS, logger),
  };
}
