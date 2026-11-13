import {
  Catch,
  HttpException,
  Inject,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';
import { ErrorDetailsSchema, type ErrorDetails } from '@apnatown/shared/wire';
import type { Logger } from 'pino';
import { correlationId, RUNTIME_LOGGER } from '../logger/logger';
import { DomainError, errorResponse, type ErrorCode } from './errors';

@Catch()
export class ErrorFilter implements ExceptionFilter {
  constructor(@Inject(RUNTIME_LOGGER) private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    let code: ErrorCode = 'COMMON_INTERNAL_ERROR';
    let details: ErrorDetails = {};
    let retryAfterSeconds: number | undefined;
    if (exception instanceof DomainError) {
      const parsed = ErrorDetailsSchema.safeParse(exception.details);
      if (parsed.success) {
        code = exception.code;
        details = parsed.data;
        retryAfterSeconds = exception.retryAfterSeconds;
      }
    } else if (exception instanceof ZodValidationException) {
      code = 'COMMON_VALIDATION_FAILED';
      // Only declared top-level DTO paths; never nested dictionary keys or values.
      const validation = exception.getZodError();
      const fields =
        validation instanceof ZodError
          ? validation.issues
              .map((issue) => issue.path[0])
              .filter(
                (field): field is string =>
                  typeof field === 'string' &&
                  /^[A-Za-z][A-Za-z0-9_]{0,99}$/.test(field),
              )
          : [];
      if (fields.length)
        details = { fields: [...new Set(fields)].slice(0, 50) };
    } else if (exception instanceof HttpException) {
      const codes: Record<number, ErrorCode> = {
        400: 'COMMON_VALIDATION_FAILED',
        401: 'COMMON_UNAUTHENTICATED',
        403: 'COMMON_FORBIDDEN',
        404: 'COMMON_NOT_FOUND',
        409: 'COMMON_CONFLICT',
        413: 'COMMON_VALIDATION_FAILED',
        429: 'COMMON_RATE_LIMITED',
        503: 'COMMON_UNAVAILABLE',
      };
      code = codes[exception.getStatus()] ?? 'COMMON_INTERNAL_ERROR';
    }
    const id = correlationId(response.getHeader('X-Correlation-ID'));
    const body = errorResponse(code, id, details);
    const metadata = {
      event: 'http.error',
      correlationId: id,
      code,
      status: body.status,
    };
    if (body.status >= 500) this.logger.error(metadata);
    else this.logger.warn(metadata);
    response.setHeader('X-Correlation-ID', id);
    response.setHeader('Cache-Control', 'private, no-store');
    if (retryAfterSeconds !== undefined)
      response.setHeader('Retry-After', retryAfterSeconds);
    response.status(body.status).json(body);
  }
}
