import type { INestApplicationContext } from '@nestjs/common';
import type { Server } from 'node:http';
import type { Logger } from 'pino';
import {
  READINESS_REPOSITORY,
  ReadinessService,
  type ReadinessRepository,
} from './health/readiness';

export function shutdownHandler(
  app: INestApplicationContext,
  server: Server,
  timeoutMs: number,
  logger: Logger,
  stopBackgroundWork?: () => Promise<void>,
): () => Promise<void> {
  let pending: Promise<void> | undefined;
  return () =>
    (pending ??= (async () => {
      app.get(ReadinessService).stop();
      logger.info({ event: 'shutdown.started' });
      const deadline = setTimeout(() => {
        server.closeAllConnections();
        logger.error({ event: 'shutdown.deadline' });
        process.exit(1);
      }, timeoutMs);
      deadline.unref();
      // Stop accepting connections; drain active requests before releasing the DB.
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
          server.closeIdleConnections();
        }),
        stopBackgroundWork?.(),
      ]);
      await app.get<ReadinessRepository>(READINESS_REPOSITORY).close();
      await app.close();
      logger.info({ event: 'shutdown.completed' });
      logger.flush();
      // A failed drain must leave the deadline armed for remaining connections.
      clearTimeout(deadline);
    })());
}

export function handleSignals(
  shutdown: () => Promise<void>,
  logger: Logger,
): void {
  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.once(signal, () => {
      void shutdown().catch(() => {
        logger.error({ event: 'shutdown.failed' });
        process.exitCode = 1;
      });
    });
  }
}
