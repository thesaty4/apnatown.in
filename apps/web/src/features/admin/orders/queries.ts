'use client';

import {
  AdminOrderFilterSchema,
  AdminOrderPageSchema,
  OrderDetailSchema,
  type AdminOrderFilter,
} from '@apnatown/shared/orders';
import {
  privateInfiniteQueryOptions,
  privateQueryOptions,
} from '../../../shared/api/private-query';
import { queryKeys, type AccountScope } from '../../../shared/api/query-keys';
import type { BrowserApi } from '../../../shared/api/browser';
import { retryTransientRead, unwrap } from '../../../shared/api/result';
import type { AdminContext } from '../AdminShell';

type Reader = Pick<BrowserApi, 'GET'>;
type Ctx = Pick<AdminContext, 'api' | 'scope' | 'lifecycle' | 'me'>;
const PAGE_SIZE = 20;
const withSignal = (signal?: AbortSignal) => (signal ? { signal } : {});

/** Filters the API has no data source for yet (always empty today). */
export const UNAVAILABLE_FILTERS: ReadonlySet<AdminOrderFilter> = new Set([
  'disputes',
  'refunds',
  'failed',
]);

/** Validated `?filter=`; anything else falls back to All. */
export function readOrderFilter(value: string | null): AdminOrderFilter {
  const parsed = AdminOrderFilterSchema.safeParse(value);
  return parsed.success ? parsed.data : 'all';
}

export const adminOrdersHref = (filter: AdminOrderFilter) =>
  filter === 'all' ? '/admin/orders' : `/admin/orders?filter=${filter}`;

/** The list filter rides along only to rebuild the Back link. */
export const adminOrderHref = (id: string, filter: AdminOrderFilter) =>
  `/admin/orders/${id}${filter === 'all' ? '' : `?filter=${filter}`}`;

/** Every admin order read sits under one root, separated by the admin scope
 * revision that read it, so pages read under an older grant never mix. */
export const adminOrderKeys = {
  root: (scope: AccountScope) => [...queryKeys.admin(scope), 'orders'] as const,
  list: (scope: AccountScope, revision: string, filter: AdminOrderFilter) =>
    [...adminOrderKeys.root(scope), 'list', revision, filter] as const,
  detail: (scope: AccountScope, revision: string, id: string) =>
    [...adminOrderKeys.root(scope), 'detail', revision, id] as const,
};

async function listAdminOrders(
  api: Reader,
  filter: AdminOrderFilter,
  cursor: string | undefined,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/admin/orders', {
      params: {
        query: { filter, limit: PAGE_SIZE, ...(cursor && { cursor }) },
      },
      ...withSignal(signal),
    }),
    AdminOrderPageSchema,
  );
}

async function getAdminOrder(
  api: Reader,
  orderId: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/admin/orders/{orderId}', {
      params: { path: { orderId } },
      ...withSignal(signal),
    }),
    OrderDetailSchema,
  );
}

export function adminOrdersOptions(
  { api, scope, lifecycle, me }: Ctx,
  filter: AdminOrderFilter,
) {
  return {
    ...privateInfiniteQueryOptions(
      adminOrderKeys.list(scope, me.scopeRevision, filter),
      scope.epoch,
      lifecycle,
      (cursor, signal) => listAdminOrders(api, filter, cursor, signal),
    ),
    retry: retryTransientRead,
  };
}

/** Read-only detail; re-read on every mount (private, no-store). */
export function adminOrderOptions(
  { api, scope, lifecycle, me }: Ctx,
  id: string,
) {
  return {
    ...privateQueryOptions(
      adminOrderKeys.detail(scope, me.scopeRevision, id),
      scope.epoch,
      lifecycle,
      (signal) => getAdminOrder(api, id, signal),
    ),
    retry: retryTransientRead,
    staleTime: 0,
    gcTime: 60_000,
  };
}
