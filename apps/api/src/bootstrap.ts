import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Server } from 'node:http';
import { AppModule } from './app.module';
import type { RuntimeConfig } from './shared/config/config';
import { configureHttp } from './shared/http/security';
import { createLogger, NestLogger } from './shared/logger/logger';
import { mountLocalApiDocs } from './shared/openapi/docs-ui';
import { shutdownHandler } from './shared/lifecycle';
import { RealtimeHub } from './shared/realtime/realtime-hub';

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
  mountLocalApiDocs(app, config);
  await app.init();
  const server = app.getHttpServer() as Server;
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.keepAliveTimeout = 5000;
  const hub = app.get(RealtimeHub);
  return {
    app,
    logger,
    // Long-lived SSE streams are ended so the HTTP server can drain.
    shutdown: shutdownHandler(
      app,
      server,
      config.SHUTDOWN_TIMEOUT_MS,
      logger,
      () => Promise.resolve(hub.closeAll()),
    ),
  };
}
