'use client';

import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  CUSTOMER_CANCEL_REASONS,
  type CustomerOrderGroup,
  type OrderDetail,
} from '@apnatown/shared/orders';
import {
  accountScope,
  queryKeys,
  type AccountScope,
} from '../../shared/api/query-keys';
import {
  privateInfiniteQueryOptions,
  privateQueryOptions,
  reconcilePrivate,
} from '../../shared/api/private-query';
import { failureCode, retryTransientRead } from '../../shared/api/result';
import { useIdempotencyKey } from '../../shared/api/idempotency';
import { usePrivateMutation } from '../../shared/api/use-private-mutation';
import { useSession } from '../../shared/auth/SessionProvider';
import { useRealtimeInvalidation } from '../../shared/realtime/RealtimeProvider';
import { isTransient } from '../cart/queries';
import {
  cancelOrder,
  getDeliveryCode,
  getOrder,
  listOrders,
  reissueDeliveryCode,
} from './api';

export type CancelReason = (typeof CUSTOMER_CANCEL_REASONS)[number];

/** Signed-in customer scope; null while the session is not ready. */
export function useOrdersScope() {
  const session = useSession();
  const { state, epoch } = session;
  const scope = state.kind === 'ready' ? accountScope(state.data, epoch) : null;
  return { ...session, scope };
}

const pending = (...parts: string[]) => ['private', 'pending', ...parts];

/** Live customer orders: accept/reject, every pickup/delivery step and code
 * reissue re-read the list pages and open detail (one shared root). */
function useCustomerOrdersLive(scope: AccountScope | null) {
  useRealtimeInvalidation(
    ['order'],
    scope ? [queryKeys.customerOrdersRoot(scope)] : null,
  );
}

/** Freshness: 30 s shared default with focus/reconnect refetch; pages are
 * keyed by the URL group, so a tab change resets the cursor set. */
export function useCustomerOrders(group: CustomerOrderGroup) {
  const { api, lifecycle, scope } = useOrdersScope();
  useCustomerOrdersLive(scope);
  return useInfiniteQuery({
    ...privateInfiniteQueryOptions(
      scope ? queryKeys.customerOrders(scope, group) : pending('orders', group),
      scope?.epoch ?? 0,
      lifecycle,
      (cursor, signal) => listOrders(api, group, cursor, signal),
    ),
    enabled: scope !== null,
    retry: retryTransientRead,
  });
}

export function useCustomerOrder(orderId: string) {
  const { api, lifecycle, scope } = useOrdersScope();
  useCustomerOrdersLive(scope);
  return useQuery({
    ...privateQueryOptions(
      scope
        ? queryKeys.customerOrder(scope, orderId)
        : pending('order', orderId),
      scope?.epoch ?? 0,
      lifecycle,
      (signal) => getOrder(api, orderId, signal),
    ),
    enabled: scope !== null,
    retry: retryTransientRead,
  });
}

/**
 * The live handover code: memory-only (gcTime 0, never persisted or
 * dehydrated), always re-read on mount/focus. Enabled only while the server
 * grants `view_code`; the nonsecret code version keys each generation.
 */
export function useDeliveryCode(order: OrderDetail) {
  const { api, lifecycle, scope } = useOrdersScope();
  const enabled = scope !== null && order.allowedActions.includes('view_code');
  const version = order.handover?.codeVersion ?? null;
  return useQuery({
    ...privateQueryOptions(
      scope
        ? queryKeys.deliveryCode(scope, order.id, version)
        : pending('code', order.id),
      scope?.epoch ?? 0,
      lifecycle,
      (signal) => getDeliveryCode(api, order.id, signal),
    ),
    enabled,
    gcTime: 0,
    staleTime: 0,
    retry: retryTransientRead,
  });
}

/** Command results replace the detail now; lists/counts refetch. */
function useOrderCommandContext(orderId: string) {
  const { api, lifecycle, scope } = useOrdersScope();
  const client = useQueryClient();
  const keys = useIdempotencyKey();
  async function settle(order: OrderDetail | null, assertCurrent: () => void) {
    if (!scope) return;
    const detail = queryKeys.customerOrder(scope, orderId);
    if (order) await reconcilePrivate(client, detail, order, assertCurrent);
    else void client.invalidateQueries({ queryKey: detail, exact: true });
    void client.invalidateQueries({
      queryKey: [...queryKeys.customerOrdersRoot(scope), 'list'],
    });
  }
  return { api, lifecycle, keys, settle };
}

/** POST /orders/{id}/cancel {event:'cancel'}; same reason+version ⇒ same key. */
export function useCancelOrder(orderId: string) {
  const { api, lifecycle, keys, settle } = useOrderCommandContext(orderId);
  return usePrivateMutation(
    lifecycle,
    async (
      input: { reasonKey: CancelReason; expectedVersion: number },
      assertCurrent,
    ) => {
      const body = { event: 'cancel' as const, ...input };
      const key = keys.for(JSON.stringify([orderId, body]));
      try {
        const order = await cancelOrder(api, orderId, body, key, assertCurrent);
        keys.clear();
        await settle(order, assertCurrent);
        return order;
      } catch (error) {
        if (!isTransient(error)) {
          keys.clear();
          if (failureCode(error) === 'ORDER_VERSION_CONFLICT')
            await settle(null, assertCurrent);
        }
        throw error;
      }
    },
  );
}

/** POST /delivery/orders/{id}/code/reissue; the detail refetch then moves
 * the code query to the new generation's key. */
export function useReissueCode(orderId: string) {
  const { api, lifecycle, keys, settle } = useOrderCommandContext(orderId);
  return usePrivateMutation(
    lifecycle,
    async (expectedCodeVersion: number, assertCurrent) => {
      const key = keys.for(JSON.stringify([orderId, expectedCodeVersion]));
      try {
        const code = await reissueDeliveryCode(
          api,
          orderId,
          expectedCodeVersion,
          key,
          assertCurrent,
        );
        keys.clear();
        await settle(null, assertCurrent);
        return code.codeVersion;
      } catch (error) {
        if (!isTransient(error)) keys.clear();
        throw error;
      }
    },
  );
}
