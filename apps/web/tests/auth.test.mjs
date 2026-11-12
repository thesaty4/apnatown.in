import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {
  ProfileSchema,
  UpdateProfileSchema,
  PreferencesSchema,
} from '@apnatown/shared/users';
import { distributeCode, remainingSeconds } from '../src/features/auth/otp.ts';
import {
  safeReturnTo,
  landing,
  loginHref,
} from '../src/shared/auth/return-to.ts';
import { sessionTransport } from '../src/shared/api/session-transport.ts';
import { unwrap, ApiFailure } from '../src/shared/api/result.ts';
import { Login } from '../src/features/auth/Login.tsx';
import { OtpInput } from '../src/features/auth/OtpInput.tsx';
import { Profile } from '../src/features/users/Profile.tsx';
import { Preferences } from '../src/features/users/Preferences.tsx';
import { Account } from '../src/features/users/Account.tsx';
import { render, profile, session } from './fixtures.mjs';

const empty = () => Array(6).fill('');
test('OTP paste distributes six digits from any box; partial input auto-advances without verification', () => {
  assert.deepEqual(distributeCode(empty(), '12 34-56', 3), {
    digits: ['1', '2', '3', '4', '5', '6'],
    focus: 5,
  });
  assert.deepEqual(distributeCode(empty(), '8', 0), {
    digits: ['8', '', '', '', '', ''],
    focus: 1,
  });
  assert.deepEqual(distributeCode(empty(), 'x', 2), {
    digits: empty(),
    focus: 2,
  });
  assert.equal(
    remainingSeconds(
      '2026-01-01T00:00:30Z',
      Date.parse('2026-01-01T00:00:00Z'),
    ),
    30,
  );
  assert.equal(
    remainingSeconds(
      '2026-01-01T00:00:30Z',
      Date.parse('2026-01-01T00:01:00Z'),
    ),
    0,
  );
});

test('return-to rejects external, encoded, operational, missing-route and auth-loop targets', () => {
  for (const target of [
    'https://evil.invalid',
    '//evil.invalid',
    '/\\evil.invalid',
    '/account\n',
    '/%61ccount',
    '/hi/account',
    '/api/auth/logout',
    '/admin',
    '/rider',
    '/login',
    '/session-expired',
    '/x/../account',
    '/account/addresses',
    '/videos/test',
    ['/', '/account'],
  ])
    assert.equal(safeReturnTo(target), undefined, String(target));
  assert.equal(
    safeReturnTo('/account/profile?returnTo=//evil.invalid&onboarding=1#name'),
    '/account/profile#name',
  );
  assert.equal(
    loginHref('hi', '/account/preferences'),
    '/hi/login?returnTo=%2Faccount%2Fpreferences',
  );
  assert.equal(landing(session, undefined, 'hi'), '/hi');
  assert.equal(
    landing({ ...session, roles: ['vendor'] }, '/vendor', 'en'),
    '/account',
  );
});

test('same-origin mutation sends CSRF and no-store, and never silently rebinds a stale token', async () => {
  globalThis.window = { location: { origin: 'https://apnatown.test' } };
  const calls = [];
  const controller = new AbortController();
  const transport = sessionTransport(
    async (request, init) => {
      calls.push({ request, init });
      return Response.json({ ok: true });
    },
    {
      signal: () => controller.signal,
      csrf: async () => 'new-binding',
      invalid() {},
    },
  );
  await transport(
    new Request('https://apnatown.test/api/users/me', {
      method: 'PATCH',
      body: '{}',
    }),
  );
  assert.equal(calls[0].init.headers.get('X-CSRF-Token'), 'new-binding');
  assert.equal(calls[0].init.credentials, 'same-origin');
  assert.equal(calls[0].init.cache, 'no-store');
  assert.equal(calls[0].init.redirect, 'error');
  await transport(
    new Request('https://apnatown.test/api/users/me', {
      method: 'PATCH',
      headers: { 'X-CSRF-Token': 'old-account-binding' },
      body: '{}',
    }),
  );
  assert.equal(
    calls[1].init.headers.get('X-CSRF-Token'),
    'old-account-binding',
  );
  await assert.rejects(
    transport(new Request('https://evil.test/api/users/me')),
  );
  await assert.rejects(
    transport(new Request('https://apnatown.test/users/me')),
  );
  delete globalThis.window;
});

test('denied mutations are not retried; late responses after invalidation are discarded', async () => {
  globalThis.window = { location: { origin: 'https://apnatown.test' } };
  let calls = 0;
  const invalid = [];
  const controller = new AbortController();
  const denied = sessionTransport(
    async () => {
      calls++;
      return Response.json({ code: 'CSRF_INVALID' }, { status: 403 });
    },
    {
      signal: () => controller.signal,
      csrf: async () => 'binding',
      invalid: (code) => invalid.push(code),
    },
  );
  await denied(
    new Request('https://apnatown.test/api/auth/logout', { method: 'POST' }),
  );
  assert.equal(calls, 1);
  assert.deepEqual(invalid, ['CSRF_INVALID']);
  const late = sessionTransport(
    async () => {
      controller.abort();
      return Response.json(profile);
    },
    {
      signal: () => controller.signal,
      csrf: async () => 'binding',
      invalid() {},
    },
  );
  await assert.rejects(late(new Request('https://apnatown.test/api/users/me')));
  delete globalThis.window;
});

test('profile/preferences use shared validation, exact fields and no success-shaped response fallback', () => {
  assert.equal(
    UpdateProfileSchema.safeParse({ displayName: '<script>' }).success,
    false,
  );
  assert.equal(
    UpdateProfileSchema.safeParse({ displayName: 'A' }).success,
    false,
  );
  assert.equal(
    UpdateProfileSchema.safeParse({ phone: '+919000000000' }).success,
    false,
  );
  assert.equal(
    UpdateProfileSchema.safeParse({ email: 'not-an-email' }).success,
    false,
  );
  assert.equal(
    PreferencesSchema.safeParse({ locale: 'hi', theme: 'auto' }).success,
    true,
  );
  assert.equal(
    PreferencesSchema.safeParse({ locale: 'hi', theme: 'auto', consent: true })
      .success,
    false,
  );
  assert.throws(
    () => unwrap({ response: Response.json({}), data: {} }, ProfileSchema),
    ApiFailure,
  );
  assert.throws(
    () =>
      unwrap(
        {
          response: Response.json({}, { status: 403 }),
          error: {
            code: 'ACCOUNT_UNAVAILABLE',
            message_key: 'errors.auth.accountUnavailable',
            status: 403,
            details: {},
            correlationId: 'test-only',
          },
        },
        ProfileSchema,
      ),
    /ACCOUNT_UNAVAILABLE/,
  );
});

for (const locale of ['en', 'hi']) {
  test(`${locale}: logout uses one initially closed shared confirmation with no inline duplicate`, async () => {
    const markup = await render(
      React.createElement(Account, {
        initial: { kind: 'ready', data: profile },
        owner: profile.userId,
      }),
      { locale },
    );
    const dialogs = markup.match(/<dialog\b[\s\S]*?<\/dialog>/g) ?? [];
    assert.equal(dialogs.length, 1);
    const dialog = dialogs[0];
    assert.match(dialog, /data-apnatown-overlay=""/);
    assert.match(dialog, /role="alertdialog"/);
    assert.match(dialog, /aria-labelledby="/);
    assert.match(dialog, /aria-describedby="/);
    assert.doesNotMatch(dialog, /<dialog\b[^>]*\sopen(?:[=\s>])/);
    const title = locale === 'en' ? 'Log out?' : 'लॉग आउट करें?';
    const cancel = locale === 'en' ? 'Cancel' : 'रद्द करें';
    assert.ok(dialog.includes(title));
    assert.ok(dialog.includes(cancel));
    assert.ok(!markup.replace(dialog, '').includes(title));
  });
  test(`${locale}: six labelled OTP boxes, mobile autofill, and disabled lock state`, async () => {
    const markup = await render(
      React.createElement(OtpInput, {
        digits: empty(),
        onChange() {},
        disabled: true,
        invalid: true,
      }),
      { locale },
    );
    assert.equal((markup.match(/<input /g) ?? []).length, 6);
    assert.equal((markup.match(/<label /g) ?? []).length, 6);
    assert.match(markup, /one-time-code/);
    assert.match(markup, /<fieldset disabled/);
    assert.match(markup, /aria-invalid="true"/);
    assert.doesNotMatch(markup, /123456/);
  });
  test(`${locale}: guest and unavailable states never render own profile data`, async () => {
    for (const code of [
      'SESSION_EXPIRED',
      'ACCOUNT_UNAVAILABLE',
      'REQUEST_FAILED',
    ]) {
      const markup = await render(
        React.createElement(Account, {
          initial: { kind: 'ready', data: profile },
          owner: profile.userId,
        }),
        { locale, initial: { kind: 'error', code } },
      );
      assert.doesNotMatch(markup, /Test Customer|9000000000/);
    }
  });
  test(`${locale}: profile, empty completion, preferences, skeleton and error components render`, async () => {
    const markup = await render(
      React.createElement(Profile, {
        initial: { kind: 'ready', data: profile },
        owner: profile.userId,
        onboarding: false,
      }),
      { locale },
    );
    assert.match(markup, /readOnly=""/);
    assert.doesNotMatch(markup, /type="file"|data-requests|addresses/);
    const emptyMarkup = await render(
      React.createElement(Profile, {
        initial: { kind: 'ready', data: { ...profile, displayName: null } },
        owner: profile.userId,
        onboarding: true,
      }),
      { locale },
    );
    assert.match(emptyMarkup, /href="\/(?:hi)?"/);
    const preferences = await render(
      React.createElement(Preferences, {
        initial: { kind: 'ready', data: { locale, theme: 'auto' } },
        owner: profile.userId,
      }),
      { locale },
    );
    assert.equal((preferences.match(/<select /g) ?? []).length, 2);
    const skeleton = await render(
      React.createElement(Profile, {
        initial: { kind: 'ready', data: profile },
        owner: 'another-owner',
        onboarding: false,
      }),
      { locale },
    );
    assert.doesNotMatch(skeleton, /Test Customer|9000000000/);
    assert.match(skeleton, /aria-busy="true"/);
    const error = await render(
      React.createElement(Profile, {
        initial: { kind: 'error', code: 'REQUEST_FAILED' },
        owner: profile.userId,
        onboarding: false,
      }),
      { locale },
    );
    assert.match(error, /role="alert"/);
  });
  test(`${locale}: login is a real phone form with explicitly unavailable alternatives`, async () => {
    const markup = await render(React.createElement(Login), {
      locale,
      initial: { kind: 'error', code: 'SESSION_EXPIRED' },
    });
    assert.match(markup, /type="tel"/);
    assert.match(markup, /autocomplete="tel-national"/i);
    assert.doesNotMatch(markup, /123456|localStorage|terms"\/>/);
  });
}
