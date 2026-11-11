import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { test } from 'node:test';
import type { Response } from 'express';
import { SessionCookie } from '../../../shared/auth/cookie';
import type { RuntimeConfig } from '../../../shared/config/config';
import { ChallengeInputSchema, VerifyInputSchema } from '@apnatown/shared/auth';
import {
  UpdateProfileSchema,
  UpdatePreferencesSchema,
  normalizePhone,
} from '@apnatown/shared/users';
import { NodeIdentityCrypto, NodeOtpCodes } from '../../../shared/auth/crypto';
import { CsrfSynchronizer } from '../../../shared/auth/csrf';
import type { AuthRequest } from '../../../shared/auth/request';
import { DomainError } from '../../../shared/errors/errors';
import { SystemOpaqueTokens } from '../../../shared/runtime/opaque-token';

test('Auth/Users strict DTOs reject privilege assignment, redirects and malicious input', () => {
  const phone = `6${'0'.repeat(9)}`;
  assert.equal(normalizePhone(phone), `+91${phone}`);
  assert.equal(normalizePhone(`+91${phone}`), `+91${phone}`);
  for (const input of [
    { phone, roles: ['super_admin'] },
    { phone, verified: true },
    { phone, returnUrl: 'https://invalid.example' },
    { phone: `${phone}' OR 1=1` },
    { phone: 'x'.repeat(33_000) },
  ])
    assert.equal(ChallengeInputSchema.safeParse(input).success, false);
  assert.equal(
    VerifyInputSchema.safeParse({ code: '1'.repeat(6), userId: randomUUID() })
      .success,
    false,
  );
  for (const input of [
    { userId: randomUUID(), displayName: 'Synthetic' },
    { phone },
    { roles: ['admin'] },
    { accountStatus: 'active' },
    { displayName: '<script>alert(1)</script>' },
    { displayName: 'a'.repeat(61) },
    { email: 'not-an-email' },
    {},
  ])
    assert.equal(UpdateProfileSchema.safeParse(input).success, false);
  assert.equal(
    UpdatePreferencesSchema.safeParse({ locale: 'xx' }).success,
    false,
  );
  assert.equal(
    UpdatePreferencesSchema.safeParse({ theme: 'light', userId: randomUUID() })
      .success,
    false,
  );
});

test('PII encryption is contextual and randomized; lookup and OTP hashing use separate secrets', () => {
  const crypto = new NodeIdentityCrypto(
    randomBytes(32).toString('hex'),
    randomBytes(32).toString('hex'),
  );
  const phone = `+916${'0'.repeat(9)}`;
  const encrypted = crypto.encrypt(phone, 'synthetic-phone');
  assert.notEqual(encrypted, crypto.encrypt(phone, 'synthetic-phone'));
  assert.equal(crypto.decrypt(encrypted, 'synthetic-phone'), phone);
  assert.throws(
    () => crypto.decrypt(encrypted, 'other-context'),
    /PII_DECRYPTION_FAILED/,
  );
  assert.deepEqual(crypto.phoneHash(phone), crypto.phoneHash(phone));
  const codes = new NodeOtpCodes(randomBytes(32).toString('hex'));
  const code = codes.generate();
  assert.match(code, /^\d{6}$/);
  const id = randomUUID();
  const hash = codes.hash(id, code);
  assert.equal(codes.verify(id, code, hash), true);
  assert.equal(codes.verify(randomUUID(), code, hash), false);
  assert.equal(
    codes.verify(id, `${(Number(code[0]) + 1) % 10}${code.slice(1)}`, hash),
    false,
  );
  const tokens = new SystemOpaqueTokens();
  const issued = tokens.issue('session');
  assert.equal(tokens.verify('session', issued.token, issued.hash), true);
  assert.notEqual(Buffer.from(issued.hash).toString('base64url'), issued.token);
});

test('csrf-sync validates request-local persisted state and rejects missing/old bindings', () => {
  const csrf = new CsrfSynchronizer();
  const persisted = csrf.generate();
  const request = {
    method: 'POST',
    headers: { 'x-csrf-token': persisted },
    csrfState: persisted,
  } as unknown as AuthRequest;
  csrf.protect(request, {} as Response);
  // A second instance uses the same database-hydrated state, not process-local memory.
  new CsrfSynchronizer().protect(request, {} as Response);
  for (const value of [undefined, csrf.generate(), [persisted]]) {
    const invalid = {
      ...request,
      headers: { 'x-csrf-token': value },
    } as unknown as AuthRequest;
    assert.throws(
      () => csrf.protect(invalid, {} as Response),
      (error: unknown) =>
        error instanceof DomainError && error.code === 'CSRF_INVALID',
    );
  }
});

test('Session cookies are host-only HttpOnly SameSite with Secure except explicit loopback HTTP', () => {
  for (const origin of ['http://localhost:3000', 'https://apnatown.example']) {
    const cookie = new SessionCookie({ WEB_ORIGIN: origin } as RuntimeConfig);
    const credential = new SystemOpaqueTokens().issue('session').token;
    let options: Record<string, unknown> | undefined;
    let name: string | undefined;
    cookie.set(
      {
        cookie(key: string, _token: string, settings: Record<string, unknown>) {
          name = key;
          options = settings;
        },
      } as unknown as Response,
      credential,
      new Date(Date.now() + 60_000),
    );
    assert.equal(options?.httpOnly, true);
    assert.equal(options?.sameSite, 'lax');
    assert.equal(options?.path, '/');
    assert.equal(options?.domain, undefined);
    assert.equal(options?.secure, origin.startsWith('https:'));
    assert.equal(
      name,
      origin.startsWith('https:')
        ? '__Host-apnatown_session'
        : 'apnatown_session',
    );
  }
});
