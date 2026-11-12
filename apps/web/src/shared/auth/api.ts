import { queryOptions } from '@tanstack/react-query';
import { SessionSchema, LogoutSchema } from '@apnatown/shared/auth';
import type { BrowserApi } from '../api/browser';
import { ApiFailure, normalizeFailure, unwrap } from '../api/result';
import { queryKeys } from '../api/query-keys';
import type { PrivateLifecycle } from '../api/private-lifecycle';

export function sessionOptions(api: BrowserApi, lifecycle: PrivateLifecycle) {
  return queryOptions({
    queryKey: queryKeys.session,
    queryFn: async ({ signal }) => {
      const epoch = lifecycle.snapshot();
      try {
        const session = unwrap(
          await api.GET('/auth/session', { signal }),
          SessionSchema,
        );
        signal.throwIfAborted();
        lifecycle.assert(epoch);
        if (session.accountStatus !== 'active')
          throw new ApiFailure('ACCOUNT_UNAVAILABLE');
        lifecycle.accept(session);
        return session;
      } catch (error) {
        signal.throwIfAborted();
        lifecycle.assert(epoch);
        lifecycle.advance(false); // A failed authority check never retains private data.
        throw normalizeFailure(error);
      }
    },
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: (query) =>
      query.state.status === 'success' ? 'always' : false,
    refetchOnReconnect: (query) =>
      query.state.status === 'success' ? 'always' : false,
  });
}

export async function postLogout(api: BrowserApi, assertCurrent: () => void) {
  const header = await api.mutationHeaders();
  assertCurrent();
  unwrap(
    await api.POST('/auth/logout', { params: { header }, body: {} }),
    LogoutSchema,
  );
}
