import 'server-only';
import { cache } from 'react';
import { SessionSchema } from '@apnatown/shared/auth';
import { createPrivateServerApi } from '../api/server';
import { ApiFailure, resource, unwrap } from '../api/result';

/** Request-local memoization, never a cross-user Next data cache. */
export const readSession = cache(async () => {
  const api = await createPrivateServerApi();
  return resource(async () => {
    const session = unwrap(await api.GET('/auth/session'), SessionSchema);
    if (session.accountStatus !== 'active')
      throw new ApiFailure('ACCOUNT_UNAVAILABLE');
    return session;
  });
});
