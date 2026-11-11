import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createApplication } from '../dist/bootstrap.js';
import { parseConfig } from '../dist/shared/config/config.js';
import {
  ErrorResponseSchema,
  HealthResponseSchema,
} from '@apnatown/shared/wire';
import { runtimeEnvironment } from './fixtures.mjs';

describe('C00 real compiled Nest bootstrap HTTP', () => {
  let runtime;
  let origin;
  beforeAll(async () => {
    runtime = await createApplication(parseConfig(runtimeEnvironment()));
    await runtime.app.listen(0, '127.0.0.1');
    origin = await runtime.app.getUrl();
  });
  afterAll(async () => {
    await runtime?.shutdown();
  });

  async function assertError(response, status, code) {
    expect(response.status).toBe(status);
    const body = ErrorResponseSchema.parse(await response.json());
    expect(body.code).toBe(code);
    expect(body.status).toBe(status);
    expect(body.correlationId).toBe(response.headers.get('x-correlation-id'));
    expect(body.details).toEqual({});
  }

  it('serves real live/ready probes with security headers and no dependency details', async () => {
    const live = await fetch(`${origin}/api/health/live`, {
      headers: { 'x-correlation-id': 'c00-http' },
    });
    expect(live.status).toBe(200);
    expect(HealthResponseSchema.parse(await live.json())).toEqual({
      status: 'ok',
    });
    expect(live.headers.get('x-correlation-id')).toBe('c00-http');
    expect(live.headers.get('x-content-type-options')).toBe('nosniff');
    expect(live.headers.get('content-security-policy')).toBeTruthy();
    expect(live.headers.get('x-powered-by')).toBeNull();
    expect(live.headers.get('cache-control')).toBe('no-store');
    await assertError(
      await fetch(`${origin}/api/health/ready`),
      503,
      'COMMON_UNAVAILABLE',
    );
  });

  it('rejects injected filters, unknown keys, untrusted origins and oversized/malformed bodies', async () => {
    for (const query of [
      'sort=%27%3BDROP%20TABLE%20users',
      'field=%3Cscript%3E',
      '__proto__[admin]=true',
    ]) {
      await assertError(
        await fetch(`${origin}/api/health/live?${query}`),
        400,
        'COMMON_VALIDATION_FAILED',
      );
    }
    await assertError(
      await fetch(`${origin}/api/health/live`, {
        headers: { origin: 'https://evil.invalid' },
      }),
      403,
      'COMMON_FORBIDDEN',
    );
    for (const body of ['{', JSON.stringify({ value: 'x'.repeat(40000) })]) {
      await assertError(
        await fetch(`${origin}/api/health/live`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body,
        }),
        400,
        'COMMON_VALIDATION_FAILED',
      );
    }
  });

  it('does not expose domain/login endpoints or accept role/owner/scope assertions', async () => {
    for (const path of [
      '/auth/session',
      '/auth/csrf',
      '/catalog/categories',
      '/admin',
      '/health/live',
    ]) {
      await assertError(
        await fetch(`${origin}${path}`, {
          headers: {
            role: 'super_admin',
            'x-owner-id': 'other',
            'x-admin-city': 'other',
            cookie: 'role=super_admin',
          },
        }),
        404,
        'COMMON_NOT_FOUND',
      );
    }
    await assertError(
      await fetch(`${origin}/api/auth/session`),
      404,
      'COMMON_NOT_FOUND',
    );
    const invalid = await fetch(`${origin}/api/health/live`, {
      headers: { 'x-correlation-id': '<script>' },
    });
    expect(invalid.headers.get('x-correlation-id')).toMatch(/^[a-f0-9-]{36}$/);
  });

  it('documents only actual probe controller paths with shared DTOs and one prefix', async () => {
    const spec = JSON.parse(
      await readFile('../../packages/api-client/openapi.json', 'utf8'),
    );
    expect(Object.keys(spec.paths).sort()).toEqual([
      '/health/live',
      '/health/ready',
    ]);
    expect(spec.servers).toEqual([{ url: '/api' }]);
    expect(spec.paths['/health/live'].get.operationId).toBe('healthLive');
    expect(
      spec.paths['/health/live'].get.parameters.filter(
        (parameter) => parameter.in === 'query',
      ),
    ).toEqual([]);
    expect(spec.paths['/health/ready'].get.responses['503']).toBeTruthy();
    const error = spec.components.schemas.ErrorDto;
    expect(error.required.sort()).toEqual([
      'code',
      'correlationId',
      'details',
      'message_key',
      'status',
    ]);
    expect(error.additionalProperties).toBe(false);
  });
});
