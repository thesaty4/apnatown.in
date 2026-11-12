import {
  queryOptions,
  type QueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import type { PrivateLifecycle } from './private-lifecycle';
import { normalizeFailure } from './result';

export function privateQueryOptions<T>(
  queryKey: QueryKey,
  epoch: number,
  lifecycle: PrivateLifecycle,
  read: (signal: AbortSignal) => Promise<T>,
) {
  return queryOptions({
    queryKey,
    queryFn: async ({ signal }) => {
      lifecycle.assert(epoch);
      try {
        const data = await read(signal);
        signal.throwIfAborted();
        lifecycle.assert(epoch);
        return data;
      } catch (error) {
        signal.throwIfAborted();
        lifecycle.assert(epoch);
        throw normalizeFailure(error);
      }
    },
  });
}

/** Cancel pre-write reads before seeding the authoritative result. All consumers
 * share this key. Mark stale without a redundant immediate GET; next mount/focus
 * reconciles, while the confirmed response is displayed now. */
export async function reconcilePrivate<T>(
  client: QueryClient,
  queryKey: QueryKey,
  data: T,
  assertCurrent: () => void,
) {
  assertCurrent();
  await client.cancelQueries({ queryKey, exact: true });
  assertCurrent();
  client.setQueryData(queryKey, data);
  await client.invalidateQueries({
    queryKey,
    exact: true,
    refetchType: 'none',
  });
  assertCurrent();
}
