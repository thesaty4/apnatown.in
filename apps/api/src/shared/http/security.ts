import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import type { Logger } from 'pino';
import type { RuntimeConfig } from '../config/config';
import { errorResponse } from '../errors/errors';
import { correlationId } from '../logger/logger';
import { withCorrelation } from '../logger/context';

export function configureHttp(
  app: NestExpressApplication,
  config: RuntimeConfig,
  logger: Logger,
): void {
  const express = app.getHttpAdapter().getInstance();
  express.disable('x-powered-by');
  express.set('trust proxy', false);
  app.setGlobalPrefix('api');
  app.use(helmet());
  // Coarse overload protection complements persistent endpoint/subject policies.
  let windowStart = Date.now();
  let hits = 0;
  app.use((request: Request, response: Response, next: NextFunction) => {
    const id = correlationId(request.headers['x-correlation-id']);
    const privateAccountPath = /^\/api\/(?:auth|users)(?:\/|$)/.test(
      request.path,
    );
    response.setHeader('X-Correlation-ID', id);
    response.setHeader(
      'Cache-Control',
      privateAccountPath ? 'private, no-store' : 'no-store',
    );
    const start = performance.now();
    response.on('finish', () =>
      logger.info({
        event: 'http.complete',
        correlationId: id,
        status: response.statusCode,
        durationMs: Math.round(performance.now() - start),
      }),
    );
    if (Date.now() - windowStart >= 1000) {
      windowStart = Date.now();
      hits = 0;
    }
    if (++hits > 200) {
      response.setHeader('Retry-After', '1');
      response.status(429).json(errorResponse('COMMON_RATE_LIMITED', id));
    } else if (
      request.headers.origin &&
      request.headers.origin !== new URL(config.WEB_ORIGIN).origin
    ) {
      response
        .status(403)
        .json(
          errorResponse(
            ['GET', 'HEAD'].includes(request.method) && !privateAccountPath
              ? 'COMMON_FORBIDDEN'
              : 'CSRF_INVALID',
            id,
          ),
        );
    } else withCorrelation(id, next);
  });
  app.use(cookieParser());
  // Nest's rawBody support retains bytes for future signature-verifying adapters.
  app.useBodyParser('json', { limit: '32kb', strict: true });
  app.useBodyParser('urlencoded', {
    limit: '32kb',
    extended: false,
    parameterLimit: 50,
  });
  app.use(
    (
      error: unknown,
      _request: Request,
      response: Response,
      _next: NextFunction,
    ) => {
      const invalidBody =
        error !== null &&
        typeof error === 'object' &&
        'type' in error &&
        [
          'entity.too.large',
          'entity.parse.failed',
          'parameters.too.many',
        ].includes(String(error.type));
      const body = errorResponse(
        invalidBody ? 'COMMON_VALIDATION_FAILED' : 'COMMON_INTERNAL_ERROR',
        correlationId(response.getHeader('X-Correlation-ID')),
      );
      logger[body.status >= 500 ? 'error' : 'warn']({
        event: 'http.body_rejected',
        correlationId: body.correlationId,
        code: body.code,
        status: body.status,
      });
      response.status(body.status).json(body);
    },
  );
}
