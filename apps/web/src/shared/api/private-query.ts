import {
  infiniteQueryOptions,
  queryOptions,
  type QueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import type { PrivateLifecycle } from './private-lifecycle';
import { normalizeFailure } from './result';

/** Every private read is fenced by the rendered session revision and abort. */
function guardedRead<T>(
  epoch: number,
  lifecycle: PrivateLifecycle,
  read: (signal: AbortSignal) => Promise<T>,
) {
  return async (signal: AbortSignal) => {
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
  };
}

export function privateQueryOptions<T>(
  queryKey: QueryKey,
  epoch: number,
  lifecycle: PrivateLifecycle,
  read: (signal: AbortSignal) => Promise<T>,
) {
  const guarded = guardedRead(epoch, lifecycle, read);
  return queryOptions({
    queryKey,
    queryFn: ({ signal }) => guarded(signal),
  });
}

/** Cursor-paginated private list. Pages share one key and refetch together. */
export function privateInfiniteQueryOptions<
  T extends { nextCursor: string | null },
>(
  queryKey: QueryKey,
  epoch: number,
  lifecycle: PrivateLifecycle,
  read: (cursor: string | undefined, signal: AbortSignal) => Promise<T>,
) {
  return infiniteQueryOptions({
    queryKey,
    initialPageParam: null as string | null,
    getNextPageParam: (last: T) => last.nextCursor,
    queryFn: ({ pageParam, signal }) =>
      guardedRead(epoch, lifecycle, (abort) =>
        read(pageParam ?? undefined, abort),
      )(signal),
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
