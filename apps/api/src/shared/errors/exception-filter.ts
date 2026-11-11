import {
  Catch,
  HttpException,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { correlationId } from '../logger/logger';
import { DomainError, errorResponse, type CommonCode } from './errors';

@Catch()
export class ErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    let code: CommonCode = 'COMMON_INTERNAL_ERROR';
    if (exception instanceof DomainError) code = exception.code;
    else if (exception instanceof ZodValidationException)
      code = 'COMMON_VALIDATION_FAILED';
    else if (exception instanceof HttpException) {
      const codes: Record<number, CommonCode> = {
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
    const body = errorResponse(code, id);
    response.setHeader('X-Correlation-ID', id);
    response.setHeader('Cache-Control', 'no-store');
    response.status(body.status).json(body);
  }
}
