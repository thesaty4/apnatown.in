import { randomUUID } from 'node:crypto';
import type { LoggerService } from '@nestjs/common';
import { CorrelationIdSchema } from '@apnatown/shared/wire';
import pino, { type DestinationStream, type Logger } from 'pino';
import type { RuntimeConfig } from '../config/config';
import { currentCorrelationId } from './context';

export const RUNTIME_LOGGER = Symbol('RUNTIME_LOGGER');

export function correlationId(input: unknown): string {
  const value = CorrelationIdSchema.safeParse(input);
  return value.success ? value.data : randomUUID();
}

export function createLogger(
  level: RuntimeConfig['LOG_LEVEL'],
  destination?: DestinationStream,
): Logger {
  const options: pino.LoggerOptions = {
    level,
    base: null,
    mixin: () => {
      const id = currentCorrelationId();
      return id ? { correlationId: id } : {};
    },
    // Defence in depth; callers log only explicitly selected technical metadata.
    redact: {
      paths: [
        'password',
        'token',
        'cookie',
        'authorization',
        '*.authorization',
        // Data-request deletion completion capability (never logged).
        'completionToken',
        '*.completionToken',
        'DATABASE_URL',
        'req',
        'res',
        'err',
      ],
      censor: '[REDACTED]',
    },
  };
  return destination ? pino(options, destination) : pino(options);
}

// Nest may hand us arbitrary exception messages. Never serialize those messages or stacks.
export class NestLogger implements LoggerService {
  constructor(private readonly logger: Logger) {}
  log(): void {
    this.logger.info({ event: 'nest.lifecycle' });
  }
  error(): void {
    this.logger.error({ event: 'nest.error' });
  }
  warn(): void {
    this.logger.warn({ event: 'nest.warning' });
  }
  debug(): void {
    this.logger.debug({ event: 'nest.debug' });
  }
  verbose(): void {
    this.logger.trace({ event: 'nest.trace' });
  }
  fatal(): void {
    this.logger.fatal({ event: 'nest.fatal' });
  }
}
