import { describe, expect, it } from 'vitest';
import {
  CorrelationIdSchema,
  CountSchema,
  CursorSchema,
  EmptyRequestSchema,
  ErrorResponseSchema,
  HealthResponseSchema,
  IdSchema,
  LimitSchema,
  PaiseSchema,
  SignedPaiseSchema,
  TimestampSchema,
  VersionSchema,
} from '../src/wire.js';

describe('C00 pure wire primitives (BR-01/02)', () => {
  it('preserves JSON safe integer paise and rejects coercion/overflow', () => {
    for (const value of [0, Number.MAX_SAFE_INTEGER]) {
      expect(PaiseSchema.parse(JSON.parse(JSON.stringify(value)))).toBe(value);
    }
    for (const value of [
      -1,
      1.5,
      NaN,
      Infinity,
      1n,
      '100',
      Number.MAX_SAFE_INTEGER + 1,
    ]) {
      expect(PaiseSchema.safeParse(value).success).toBe(false);
    }
    expect(SignedPaiseSchema.parse(-1)).toBe(-1);
    expect(CountSchema.safeParse(-1).success).toBe(false);
  });

  it('enforces canonical IDs, bounded versions/counts and UTC instants', () => {
    expect(IdSchema.parse('019a6a8f-0000-7000-8000-000000000001')).toBeTruthy();
    expect(IdSchema.safeParse('grocery').success).toBe(false);
    for (const value of [0, 2147483648, '1'])
      expect(VersionSchema.safeParse(value).success).toBe(false);
    expect(VersionSchema.parse(2147483647)).toBe(2147483647);
    expect(TimestampSchema.parse('2026-11-11T18:30:00.123Z')).toContain('Z');
    for (const value of ['2026-11-12T00:00:00+05:30', new Date(), 0]) {
      expect(TimestampSchema.safeParse(value).success).toBe(false);
    }
  });

  it('bounds list/cursor shapes without claiming cursor authentication', () => {
    expect(LimitSchema.parse(undefined)).toBe(20);
    expect(LimitSchema.parse(50)).toBe(50);
    for (const value of [0, 51, '20'])
      expect(LimitSchema.safeParse(value).success).toBe(false);
    for (const value of ['', 'a'.repeat(2049), '<script>', '{"offset":1}']) {
      expect(CursorSchema.safeParse(value).success).toBe(false);
    }
    expect(CursorSchema.parse('abc_DEF-123')).toBeTruthy();
  });

  it('strictly bounds probe/error contracts and rejects arbitrary details', () => {
    expect(HealthResponseSchema.parse({ status: 'ok' })).toEqual({
      status: 'ok',
    });
    expect(
      HealthResponseSchema.safeParse({
        status: 'ok',
        databaseUrl: 'not-a-secret',
      }).success,
    ).toBe(false);
    expect(
      EmptyRequestSchema.safeParse({ sort: "'; DROP TABLE users;--" }).success,
    ).toBe(false);
    const error = {
      code: 'COMMON_UNAVAILABLE',
      message_key: 'errors.common.unavailable',
      status: 503,
      details: {},
      correlationId: 'test-request',
    };
    expect(ErrorResponseSchema.parse(error)).toEqual(error);
    expect(
      ErrorResponseSchema.safeParse({ ...error, details: { sql: 'hidden' } })
        .success,
    ).toBe(false);
    expect(
      ErrorResponseSchema.safeParse({ ...error, stack: 'hidden' }).success,
    ).toBe(false);
    expect(CorrelationIdSchema.safeParse('header\r\ninjection').success).toBe(
      false,
    );
    expect(CorrelationIdSchema.safeParse('x'.repeat(65)).success).toBe(false);
  });
});
