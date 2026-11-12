import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  QueryClientProvider,
  QueryObserver,
  hydrate,
  onlineManager,
} from '@tanstack/react-query';
import { createQueryClient } from '../src/shared/api/query-client.ts';
import { hydrateResource } from '../src/shared/api/hydration.ts';
import { accountScope, queryKeys } from '../src/shared/api/query-keys.ts';
import { PrivateLifecycle } from '../src/shared/api/private-lifecycle.ts';
import { reconcilePrivate } from '../src/shared/api/private-query.ts';
import { usePrivateMutation } from '../src/shared/api/use-private-mutation.ts';
import { sessionOptions, postLogout } from '../src/shared/auth/api.ts';
import { profileOptions, saveProfile } from '../src/features/users/api.ts';
import {
  preferencesOptions,
  savePreferences,
} from '../src/shared/i18n/preferences-api.ts';
import { requestChallenge, verifyChallenge } from '../src/features/auth/api.ts';
import { ApiFailure, failureCode } from '../src/shared/api/result.ts';
import { session, profile } from './fixtures.mjs';

const success = (data) => ({ data, response: Response.json(data) });
const scope = accountScope(session, 0);
function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function fixture(t) {
  const client = createQueryClient();
  client.setDefaultOptions({
    ...client.getDefaultOptions(),
    queries: { ...client.getDefaultOptions().queries, gcTime: 0 },
  });
  t.after(() => client.clear());
  const lifecycle = new PrivateLifecycle(client, () => {});
  return { client, lifecycle };
}

// No new renderer/framework: SSR exercises the real hook/provider and exposes
// its command entrypoint. QueryObserver covers live subscription/cache behavior.
function command(client, lifecycle, operation) {
  let hook;
  function Probe() {
    hook = usePrivateMutation(lifecycle, operation);
    return null;
  }
  renderToStaticMarkup(
    React.createElement(
      QueryClientProvider,
      { client },
      React.createElement(Probe),
    ),
  );
  return hook;
}

test('request-local hydration isolates sessions; successful SSR profile/preferences/session do not refetch on mount', async (t) => {
  const { client, lifecycle } = fixture(t);
  let reads = 0;
  const api = {
    GET: async () => {
      reads++;
      throw new Error('Unexpected duplicate read');
    },
  };
  const records = [
    [sessionOptions(api, lifecycle), session],
    [profileOptions(api, scope, lifecycle), profile],
    [
      preferencesOptions(api, scope, lifecycle),
      { locale: 'hi', theme: 'dark' },
    ],
  ];
  for (const [options, data] of records) {
    const state = await hydrateResource(options.queryKey, {
      kind: 'ready',
      data,
    });
    hydrate(client, JSON.parse(JSON.stringify(state)));
    const observer = new QueryObserver(client, options);
    const unsubscribe = observer.subscribe(() => {});
    t.after(unsubscribe);
    assert.deepEqual(observer.getCurrentResult().data, data);
  }
  await tick();
  assert.equal(reads, 0);
  const another = createQueryClient();
  t.after(() => another.clear());
  const otherSession = {
    ...session,
    userId: '10000000-0000-4000-8000-000000000002',
  };
  hydrate(
    another,
    await hydrateResource(queryKeys.session, {
      kind: 'ready',
      data: otherSession,
    }),
  );
  assert.equal(
    another.getQueryData(queryKeys.session).userId,
    otherSession.userId,
  );
  assert.equal(client.getQueryData(queryKeys.session).userId, session.userId);
  assert.equal(another.getQueryData(queryKeys.profile(scope)), undefined);
});

test('two profile consumers deduplicate, forward AbortSignal, and retry only on explicit refetch', async (t) => {
  const { client, lifecycle } = fixture(t);
  const pending = deferred();
  let calls = 0;
  let signal;
  const api = {
    GET: async (_path, options) => {
      calls++;
      signal = options.signal;
      await pending.promise;
      return success(profile);
    },
  };
  const options = profileOptions(api, scope, lifecycle);
  const first = new QueryObserver(client, options);
  const second = new QueryObserver(client, options);
  t.after(first.subscribe(() => {}));
  t.after(second.subscribe(() => {}));
  assert.equal(calls, 1);
  assert.ok(signal instanceof AbortSignal);
  assert.equal(first.getCurrentResult().isPending, true);
  pending.resolve();
  await tick();
  assert.equal(first.getCurrentResult().data.displayName, profile.displayName);
  assert.deepEqual(second.getCurrentResult().data, profile);
  await first.refetch();
  assert.equal(calls, 2);
});

test('normalized API failures hydrate as errors (not empty), never retry denial/conflict/rate-limit, and recover explicitly', async (t) => {
  const { client, lifecycle } = fixture(t);
  for (const [status, code] of [
    [401, 'SESSION_EXPIRED'],
    [403, 'ACCOUNT_UNAVAILABLE'],
    [409, 'VERSION_CONFLICT'],
    [429, 'COMMON_RATE_LIMITED'],
    [503, 'REQUEST_FAILED'],
  ]) {
    let calls = 0;
    let deny = true;
    const api = {
      GET: async () => {
        calls++;
        return deny
          ? {
              error: {
                code,
                status,
                message_key: 'errors.test.denied',
                details: { fields: ['displayName'] },
                correlationId: 'test-only',
              },
              response: Response.json({}, { status }),
            }
          : success(profile);
      },
    };
    const options = profileOptions(api, scope, lifecycle);
    await assert.rejects(
      client.fetchQuery(options),
      (error) =>
        error.code === code &&
        error.status === status &&
        error.message_key === 'errors.test.denied' &&
        error.correlationId === 'test-only' &&
        error.fields[0] === 'displayName',
    );
    assert.equal(calls, 1);
    assert.equal(client.getQueryState(options.queryKey).status, 'error');
    deny = false;
    assert.deepEqual(await client.fetchQuery(options), profile);
    client.removeQueries();
  }
  const dehydrated = await hydrateResource(queryKeys.profile(scope), {
    kind: 'error',
    code: 'ACCOUNT_UNAVAILABLE',
  });
  hydrate(client, JSON.parse(JSON.stringify(dehydrated)));
  const observer = new QueryObserver(
    client,
    profileOptions(
      {
        GET: async () => {
          throw new Error('No auto retry');
        },
      },
      scope,
      lifecycle,
    ),
  );
  t.after(observer.subscribe(() => {}));
  assert.equal(observer.getCurrentResult().isError, true);
  assert.equal(
    failureCode(observer.getCurrentResult().error),
    'ACCOUNT_UNAVAILABLE',
  );
});

test('logout/expiry abort and clear private reads; ignored cancellation cannot repopulate either account cache', async (t) => {
  const { client, lifecycle } = fixture(t);
  const pending = deferred();
  let signal;
  const api = {
    GET: async (_path, options) => {
      signal = options.signal;
      await pending.promise;
      return success(profile);
    },
  };
  client.setQueryData(queryKeys.session, session);
  const read = client.fetchQuery(profileOptions(api, scope, lifecycle));
  const rejected = assert.rejects(read);
  lifecycle.expire('SESSION_EXPIRED');
  assert.equal(signal.aborted, true);
  assert.equal(client.getQueryState(queryKeys.session).status, 'error');
  assert.equal(client.getQueryData(queryKeys.session), undefined);
  pending.resolve();
  await rejected;
  await tick();
  assert.equal(client.getQueryData(queryKeys.profile(scope)), undefined);
  assert.equal(
    client.getQueryCache().findAll({ queryKey: queryKeys.private }).length,
    0,
  );
});

test('a live role/account change advances scope and removes old profile/preferences before new identity is used', async (t) => {
  const { client, lifecycle } = fixture(t);
  client.setQueryData(queryKeys.session, session);
  client.setQueryData(queryKeys.profile(scope), profile);
  client.setQueryData(queryKeys.preferences(scope), {
    locale: 'en',
    theme: 'light',
  });
  const next = { ...session, roles: ['customer', 'vendor'] };
  await client.fetchQuery({
    ...sessionOptions({ GET: async () => success(next) }, lifecycle),
    staleTime: 0,
  });
  assert.equal(lifecycle.snapshot(), 1);
  assert.equal(client.getQueryData(queryKeys.profile(scope)), undefined);
  assert.notDeepEqual(
    queryKeys.profile(scope),
    queryKeys.profile(accountScope(next, 1)),
  );
  assert.equal(
    JSON.stringify(queryKeys.profile(scope)).includes(profile.phone),
    false,
  );
  assert.equal(
    JSON.stringify(queryKeys.profile(scope)).includes('csrf'),
    false,
  );
});

test('profile mutation uses the real hook, reconciles shared detail, invalidates it, and retains no payload in mutation variables', async (t) => {
  const { client, lifecycle } = fixture(t);
  const key = queryKeys.profile(scope);
  client.setQueryData(key, profile);
  const next = { ...profile, displayName: 'Updated Test', version: 2 };
  let submitted;
  const api = {
    mutationHeaders: async () => ({
      Origin: 'https://apnatown.test',
      'X-CSRF-Token': 'test-binding',
    }),
    PATCH: async (_path, options) => {
      submitted = options;
      return success(next);
    },
  };
  const mutation = command(client, lifecycle, async (input, guard) => {
    const result = await saveProfile(api, input, guard);
    await reconcilePrivate(client, key, result, guard);
    return result;
  });
  let confirmed;
  await mutation.run({ displayName: 'Updated Test', email: null }, (data) => {
    confirmed = data;
    mutation.reset();
  });
  assert.deepEqual(confirmed, next);
  assert.equal(submitted.params.header['X-CSRF-Token'], 'test-binding');
  assert.equal(client.getQueryData(key).version, 2);
  assert.equal(client.getQueryState(key).isInvalidated, true);
  assert.ok(
    client
      .getMutationCache()
      .getAll()
      .every((item) => item.state.variables === undefined),
  );
  await tick();
  assert.equal(client.getMutationCache().getAll().length, 0);
});

test('private mutation fences late responses, late callbacks and old-render clicks after clearing caches', async (t) => {
  const { client, lifecycle } = fixture(t);
  const pending = deferred();
  let called = 0;
  const mutation = command(client, lifecycle, async (_input, guard) => {
    called++;
    await pending.promise; // A transport deliberately ignoring cancellation.
    await reconcilePrivate(client, queryKeys.profile(scope), profile, guard);
    return profile;
  });
  let callbacks = 0;
  const run = mutation.run({ displayName: 'Old draft' }, () => {
    callbacks++;
  });
  await tick();
  lifecycle.expire('SESSION_EXPIRED');
  pending.resolve();
  await run;
  assert.equal(callbacks, 0);
  assert.equal(client.getQueryData(queryKeys.profile(scope)), undefined);
  assert.equal(client.getMutationCache().getAll().length, 0);
  await mutation.run({ displayName: 'Old draft' }, () => {
    callbacks++;
  });
  assert.equal(called, 1);
  assert.equal(callbacks, 0);
});

test('pending CSRF bootstrap cannot bind an old draft to a changed session', async (t) => {
  const { client, lifecycle } = fixture(t);
  const pending = deferred();
  let writes = 0;
  const api = {
    mutationHeaders: async () => {
      await pending.promise;
      return {};
    },
    PATCH: async () => {
      writes++;
      return success(profile);
    },
  };
  const mutation = command(client, lifecycle, (input, guard) =>
    saveProfile(api, input, guard),
  );
  const run = mutation.run({ displayName: 'Old draft' });
  await tick();
  lifecycle.advance();
  pending.resolve();
  await run;
  assert.equal(writes, 0);
});

test('failed/offline mutations never replay or claim success; OTP/logout/preferences all use guarded typed commands', async (t) => {
  const { client, lifecycle } = fixture(t);
  let writes = 0;
  let callbacks = 0;
  onlineManager.setOnline(false);
  t.after(() => onlineManager.setOnline(true));
  const mutation = command(client, lifecycle, async () => {
    writes++;
    throw new TypeError('Synthetic network failure');
  });
  await mutation.run(undefined, () => {
    callbacks++;
  });
  assert.equal(writes, 1);
  assert.equal(client.getMutationCache().getAll()[0].state.isPaused, false);
  assert.ok(
    client.getMutationCache().getAll()[0].state.error instanceof ApiFailure,
  );
  onlineManager.setOnline(true);
  await client.resumePausedMutations();
  assert.equal(writes, 1);
  assert.equal(callbacks, 0);
  const seen = [];
  const challenge = {
    challengeId: '10000000-0000-4000-8000-000000000003',
    expiresAt: session.expiresAt,
    resendAfter: session.expiresAt,
  };
  const api = {
    mutationHeaders: async () => ({ 'X-CSRF-Token': 'test-binding' }),
    POST: async (path, options) => {
      seen.push([path, options]);
      return success(
        path === '/auth/logout'
          ? { loggedOut: true }
          : path.endsWith('/verify')
            ? session
            : challenge,
      );
    },
    PATCH: async (path, options) => {
      seen.push([path, options]);
      return success({ locale: 'hi', theme: 'dark' });
    },
  };
  const guard = () => lifecycle.assert(0);
  assert.deepEqual(await requestChallenge(api, '9000000000', guard), challenge);
  assert.equal(
    await verifyChallenge(
      api,
      { challengeId: challenge.challengeId, code: '654321' },
      guard,
    ),
    undefined,
  );
  assert.equal(await postLogout(api, guard), undefined);
  assert.deepEqual(await savePreferences(api, { locale: 'hi' }, guard), {
    locale: 'hi',
    theme: 'dark',
  });
  assert.equal(seen.length, 4);
  assert.ok(
    seen.every(
      ([, options]) => options.params.header['X-CSRF-Token'] === 'test-binding',
    ),
  );
});
