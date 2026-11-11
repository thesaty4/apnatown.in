import { describe, expect, it } from 'vitest';
import { Reflector } from '@nestjs/core';
import { parseConfig } from '../dist/shared/config/config.js';
import { ReadinessService } from '../dist/shared/health/readiness.js';
import { ProbeOnlyGuard } from '../dist/shared/health/probe-only.guard.js';
import {
  HealthController,
  PROBE_ROUTE,
} from '../dist/shared/health/health.controller.js';
import {
  correlationId,
  createLogger,
  NestLogger,
} from '../dist/shared/logger/logger.js';
import { runtimeEnvironment } from './fixtures.mjs';

describe('C00 config, prerequisite and route policy units', () => {
  it('rejects missing/unsafe owner configuration without echoing secrets', () => {
    const env = runtimeEnvironment();
    expect(parseConfig(env).PORT).toBe(3001);
    for (const overrides of [
      { DATABASE_URL: undefined },
      { DATABASE_URL: 'https://example.invalid' },
      {
        DATABASE_URL: env.DATABASE_URL.replace(
          'apnatown_runtime',
          'apnatown_migrator',
        ),
      },
      {
        DATABASE_URL: env.DATABASE_URL.replace('127.0.0.1', 'example.invalid'),
      },
      { CURSOR_SIGNING_KEY: 'weak' },
      { APP_ENV: 'staging' },
      { WEB_ORIGIN: 'http://127.0.0.1:3000/path' },
      { WEB_ORIGIN: 'https://evil.invalid' },
      { APP_ENV: 'production', WEB_ORIGIN: 'http://example.invalid' },
      { MIGRATION_DATABASE_URL: env.DATABASE_URL },
      { FAKE_ADAPTER: 'true' },
      { PORT: '65536' },
      { WORKER_PROBE_PORT: '3001' },
      { SHUTDOWN_TIMEOUT_MS: '0' },
      { JOB_RETRY_LIMIT: '999' },
    ])
      expect(() => parseConfig({ ...env, ...overrides })).toThrow(
        'INVALID_RUNTIME_CONFIG',
      );
  });

  it('does not turn DB loss into liveness failure and fences shutdown races', async () => {
    let available = true;
    const repository = { check: async () => available, close: async () => {} };
    const service = new ReadinessService(repository);
    expect(await service.ready()).toEqual({ status: 'ok' });
    available = false;
    await expect(service.ready()).rejects.toThrow('COMMON_UNAVAILABLE');
    expect(service.live()).toEqual({ status: 'ok' });
    repository.check = async () => {
      throw new Error('private DB error');
    };
    await expect(service.ready()).rejects.toThrow('COMMON_UNAVAILABLE');
    repository.check = async () => {
      service.stop();
      return true;
    };
    await expect(service.ready()).rejects.toThrow('COMMON_UNAVAILABLE');
  });

  it('classifies only live/ready public probes; no header grants authorization', () => {
    const reflector = new Reflector();
    const guard = new ProbeOnlyGuard(reflector);
    const context = (handler, request) => ({
      getHandler: () => handler,
      switchToHttp: () => ({ getRequest: () => request }),
    });
    for (const method of ['live', 'ready']) {
      const handler = HealthController.prototype[method];
      expect(reflector.get(PROBE_ROUTE, handler)).toBe(true);
      expect(guard.canActivate(context(handler, { method: 'GET' }))).toBe(true);
      expect(() =>
        guard.canActivate(context(handler, { method: 'POST' })),
      ).toThrow('COMMON_UNAUTHENTICATED');
    }
    for (const headers of [
      {},
      { role: 'super_admin' },
      { 'x-owner-id': 'another-owner' },
      { 'x-admin-city': 'another-city', 'x-permission': 'catalog:edit' },
    ])
      expect(() =>
        guard.canActivate(context(() => {}, { method: 'GET', headers })),
      ).toThrow('COMMON_UNAUTHENTICATED');
  });

  it('redacts structured secrets and never logs framework exception text', () => {
    let output = '';
    const logger = createLogger('info', {
      write: (line) => {
        output += line;
      },
    });
    const secret = runtimeEnvironment().CURSOR_SIGNING_KEY;
    logger.info({ password: secret, req: { headers: { cookie: secret } } });
    new NestLogger(logger).error(`private ${secret}`);
    expect(output).not.toContain(secret);
    expect(output).toContain('[REDACTED]');
    expect(correlationId('hello-123')).toBe('hello-123');
    expect(correlationId('<script>')).toMatch(/^[a-f0-9-]{36}$/);
    expect(correlationId('a'.repeat(65))).not.toBe('a'.repeat(65));
  });
});
