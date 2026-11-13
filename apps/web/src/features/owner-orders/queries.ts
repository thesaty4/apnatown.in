'use client';

import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { BusinessKind } from '@apnatown/shared/businesses';
import type { BusinessOrderTab } from '@apnatown/shared/orders';
import type { AccountScope } from '../../shared/api/query-keys';
import {
  privateInfiniteQueryOptions,
  privateQueryOptions,
} from '../../shared/api/private-query';
import { failureCode, retryTransientRead } from '../../shared/api/result';
import { useIdempotencyKey } from '../../shared/api/idempotency';
import { usePrivateMutation } from '../../shared/api/use-private-mutation';
import { useRealtimeInvalidation } from '../../shared/realtime/RealtimeProvider';
import { businessKeys, useOwnerContext } from '../businesses/queries';
import {
  getOwnerOrder,
  getOwnerOrderCounts,
  listOwnerOrders,
  runOwnerOrderCommand,
  type OwnerOrderCommand,
  type OwnerOrderCommandResult,
} from './api';
import { REFRESH_CODES } from './errors';

/** Owner order reads live under the kind-scoped business root, so vendor and
 * provider contexts (and accounts/session revisions) never share pages. */
export const ownerOrderKeys = {
  root: (scope: AccountScope, kind: BusinessKind) =>
    [...businessKeys.all(scope, kind), 'orders'] as const,
  list: (scope: AccountScope, kind: BusinessKind, tab: BusinessOrderTab) =>
    [...ownerOrderKeys.root(scope, kind), 'list', tab] as const,
  counts: (scope: AccountScope, kind: BusinessKind) =>
    [...ownerOrderKeys.root(scope, kind), 'counts'] as const,
  detail: (scope: AccountScope, kind: BusinessKind, id: string) =>
    [...ownerOrderKeys.root(scope, kind), 'detail', id] as const,
};

const pending = (kind: BusinessKind, ...part: string[]) =>
  ['private', 'pending', 'business', kind, 'orders', ...part] as const;

/** Fallback re-read while the queue is visible; the realtime stream
 * (`useOwnerOrdersLive`) is the primary path for new orders and updates. */
const COUNTS_REFRESH_MS = 60_000;

/**
 * Live owner orders: an order placed/changed for this owner refreshes the
 * queue pages, open detail, tab counts and the overview. Mounted once by the
 * dashboard shell so every vendor/provider screen stays current.
 */
export function useOwnerOrdersLive(kind: BusinessKind) {
  const { scope } = useOwnerContext();
  useRealtimeInvalidation(
    ['order'],
    scope
      ? [ownerOrderKeys.root(scope, kind), businessKeys.overview(scope, kind)]
      : null,
  );
}

export function useOwnerOrders(
  kind: BusinessKind,
  tab: BusinessOrderTab,
  enabled: boolean,
) {
  const { api, lifecycle, scope } = useOwnerContext();
  return useInfiniteQuery({
    ...privateInfiniteQueryOptions(
      scope ? ownerOrderKeys.list(scope, kind, tab) : pending(kind, tab),
      scope?.epoch ?? 0,
      lifecycle,
      (cursor, signal) => listOwnerOrders(api, kind, tab, cursor, signal),
    ),
    enabled: enabled && scope !== null,
    retry: retryTransientRead,
  });
}

export function useOwnerOrderCounts(kind: BusinessKind, enabled: boolean) {
  const { api, lifecycle, scope } = useOwnerContext();
  return useQuery({
    ...privateQueryOptions(
      scope ? ownerOrderKeys.counts(scope, kind) : pending(kind, 'counts'),
      scope?.epoch ?? 0,
      lifecycle,
      (signal) => getOwnerOrderCounts(api, kind, signal),
    ),
    enabled: enabled && scope !== null,
    retry: retryTransientRead,
    refetchInterval: COUNTS_REFRESH_MS,
  });
}

/** The business view carries the customer's address: re-read on every
 * mount and dropped soon after no screen shows it. */
export function useOwnerOrder(
  kind: BusinessKind,
  id: string,
  enabled: boolean,
) {
  const { api, lifecycle, scope } = useOwnerContext();
  return useQuery({
    ...privateQueryOptions(
      scope
        ? ownerOrderKeys.detail(scope, kind, id)
        : pending(kind, 'detail', id),
      scope?.epoch ?? 0,
      lifecycle,
      (signal) => getOwnerOrder(api, kind, id, signal),
    ),
    enabled: enabled && scope !== null,
    retry: retryTransientRead,
    staleTime: 0,
    gcTime: 60_000,
  });
}

/**
 * One owner command per user intent (Idempotency-Key reused only for the
 * identical payload). Not optimistic: the server's OrderDetail is seeded, or
 * the order is re-read after a delivery handover; queue pages, counts and the
 * overview are marked stale. A stale/handover rejection re-reads the order so
 * versions, code metadata and attempts left are authoritative again.
 */
export function useOwnerOrderCommand(kind: BusinessKind, id: string) {
  const { api, lifecycle, scope } = useOwnerContext();
  const client = useQueryClient();
  const keys = useIdempotencyKey();
  const mutation = usePrivateMutation(
    lifecycle,
    async (
      input: { command: OwnerOrderCommand; key: string },
      assertCurrent,
    ): Promise<OwnerOrderCommandResult> => {
      const detailKey = scope ? ownerOrderKeys.detail(scope, kind, id) : null;
      try {
        const result = await runOwnerOrderCommand(
          api,
          kind,
          id,
          input.command,
          input.key,
          assertCurrent,
        );
        assertCurrent();
        if (!scope || !detailKey) return result;
        if (result.kind === 'detail') {
          await client.cancelQueries({ queryKey: detailKey, exact: true });
          assertCurrent();
          client.setQueryData(detailKey, result.detail);
        } else {
          await client.invalidateQueries({ queryKey: detailKey, exact: true });
        }
        await Promise.all([
          client.invalidateQueries({
            queryKey: [...ownerOrderKeys.root(scope, kind), 'list'],
          }),
          client.invalidateQueries({
            queryKey: ownerOrderKeys.counts(scope, kind),
          }),
          client.invalidateQueries({
            queryKey: businessKeys.overview(scope, kind),
          }),
        ]);
        return result;
      } catch (error) {
        if (detailKey && REFRESH_CODES.has(failureCode(error)))
          void client.invalidateQueries({ queryKey: detailKey, exact: true });
        throw error;
      }
    },
  );
  return {
    mutation,
    run(command: OwnerOrderCommand, onSuccess?: () => void) {
      const key = keys.for(JSON.stringify(command));
      void mutation.run({ command, key }, () => {
        keys.clear();
        onSuccess?.();
      });
    },
  };
}
