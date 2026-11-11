import 'reflect-metadata';
import { createServer } from 'node:http';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import { parseConfig } from './shared/config/config';
import { DomainError, errorResponse } from './shared/errors/errors';
import { ReadinessService } from './shared/health/readiness';
import { OutboxRelay } from './shared/jobs/outbox-relay';
import { handleSignals, shutdownHandler } from './shared/lifecycle';
import { withCorrelation } from './shared/logger/context';
import {
  correlationId,
  createLogger,
  NestLogger,
} from './shared/logger/logger';

async function main(): Promise<void> {
  const config = parseConfig(process.env);
  const logger = createLogger(config.LOG_LEVEL);
  const app = await NestFactory.createApplicationContext(
    WorkerModule.forRoot(config),
    {
      logger: new NestLogger(logger),
      abortOnError: false,
    },
  );
  const relay = app.get(OutboxRelay);
  const health = app.get(ReadinessService);
  const server = createServer({ maxHeaderSize: 8192 }, (request, response) => {
    const id = correlationId(request.headers['x-correlation-id']);
    response.setHeader('X-Correlation-ID', id);
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    const probe = async () => {
      if (!['GET', 'HEAD'].includes(request.method ?? ''))
        throw new DomainError('COMMON_NOT_FOUND');
      if (request.url === '/api/health/live') return health.live();
      if (request.url === '/api/health/ready') return health.ready();
      throw new DomainError('COMMON_NOT_FOUND');
    };
    void withCorrelation(id, probe)
      .then((body) => response.end(JSON.stringify(body)))
      .catch((error: unknown) => {
        const body = errorResponse(
          error instanceof DomainError ? error.code : 'COMMON_INTERNAL_ERROR',
          id,
        );
        logger[body.status >= 500 ? 'error' : 'warn']({
          event: 'worker.probe_failed',
          correlationId: id,
          code: body.code,
          status: body.status,
        });
        response.statusCode = body.status;
        response.end(JSON.stringify(body));
      });
  });
  server.requestTimeout = 5000;
  server.headersTimeout = 5000;
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(config.WORKER_PROBE_PORT, '127.0.0.1', resolve);
  });
  relay.start();
  handleSignals(
    shutdownHandler(app, server, config.SHUTDOWN_TIMEOUT_MS, logger),
    logger,
  );
  logger.info({
    event: 'worker.listening',
    outboxRelayRegistered: true,
    consumersRegistered: false,
  });
}

void main().catch(() => {
  createLogger('error').error({ event: 'worker.startup_failed' });
  process.exitCode = 1;
});
