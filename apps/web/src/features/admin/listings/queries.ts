'use client';

import { useQueryClient } from '@tanstack/react-query';
import type {
  AdminBusinessListingType,
  ListingReportStatus,
} from '@apnatown/shared/admin';
import {
  privateInfiniteQueryOptions,
  privateQueryOptions,
} from '../../../shared/api/private-query';
import { queryKeys, type AccountScope } from '../../../shared/api/query-keys';
import { useIdempotencyKey } from '../../../shared/api/idempotency';
import { usePrivateMutation } from '../../../shared/api/use-private-mutation';
import { failureCode, retryTransientRead } from '../../../shared/api/result';
import type { BrowserApi } from '../../../shared/api/browser';
import type { AdminContext } from '../AdminShell';
import {
  getListingDetail,
  getListingReport,
  listListingProducts,
  listListingReports,
  listListings,
  type Command,
} from './api';
import type { ListingFilters } from './filters';
import { isListingConflict } from './parts';

type Ctx = Pick<AdminContext, 'api' | 'scope' | 'lifecycle' | 'me'>;

/** Private, no-store reads: a short stale time only dedupes mounts. */
const FRESH_MS = 5_000;

/** Every listing/report/product read lives under one root, separated by the
 * admin scope revision that read it; any confirmed command invalidates it. */
export const listingKeys = {
  root: (scope: AccountScope) =>
    [...queryKeys.admin(scope), 'listings'] as const,
  list: (scope: AccountScope, revision: string, filters: object) =>
    [...listingKeys.root(scope), 'list', revision, filters] as const,
  detail: (scope: AccountScope, revision: string, type: string, id: string) =>
    [...listingKeys.root(scope), 'detail', revision, type, id] as const,
  products: (scope: AccountScope, revision: string, businessId: string) =>
    [...listingKeys.root(scope), 'products', revision, businessId] as const,
  reports: (
    scope: AccountScope,
    revision: string,
    targetId: string,
    status: string,
  ) =>
    [
      ...listingKeys.root(scope),
      'reports',
      revision,
      targetId,
      status,
    ] as const,
  report: (scope: AccountScope, revision: string, id: string) =>
    [...listingKeys.root(scope), 'report', revision, id] as const,
};

const readPolicy = { staleTime: FRESH_MS, retry: retryTransientRead };

export function listingsOptions(
  { api, scope, lifecycle, me }: Ctx,
  { type, q, status }: Pick<ListingFilters, 'type' | 'q' | 'status'>,
) {
  const filters = { type, q: q ?? null, status: status ?? null };
  return {
    ...privateInfiniteQueryOptions(
      listingKeys.list(scope, me.scopeRevision, filters),
      scope.epoch,
      lifecycle,
      (cursor, signal) =>
        listListings(api, { type, q, status }, cursor, signal),
    ),
    ...readPolicy,
  };
}

export function listingDetailOptions(
  { api, scope, lifecycle, me }: Ctx,
  type: AdminBusinessListingType,
  id: string,
) {
  return {
    ...privateQueryOptions(
      listingKeys.detail(scope, me.scopeRevision, type, id),
      scope.epoch,
      lifecycle,
      (signal) => getListingDetail(api, type, id, signal),
    ),
    ...readPolicy,
  };
}

export function listingProductsOptions(
  { api, scope, lifecycle, me }: Ctx,
  businessId: string,
) {
  return {
    ...privateInfiniteQueryOptions(
      listingKeys.products(scope, me.scopeRevision, businessId),
      scope.epoch,
      lifecycle,
      (cursor, signal) => listListingProducts(api, businessId, cursor, signal),
    ),
    ...readPolicy,
  };
}

export function listingReportsOptions(
  { api, scope, lifecycle, me }: Ctx,
  targetId: string,
  status: ListingReportStatus,
) {
  return {
    ...privateInfiniteQueryOptions(
      listingKeys.reports(scope, me.scopeRevision, targetId, status),
      scope.epoch,
      lifecycle,
      (cursor, signal) =>
        listListingReports(api, targetId, status, cursor, signal),
    ),
    ...readPolicy,
  };
}

export function listingReportOptions(
  { api, scope, lifecycle, me }: Ctx,
  id: string,
) {
  return {
    ...privateQueryOptions(
      listingKeys.report(scope, me.scopeRevision, id),
      scope.epoch,
      lifecycle,
      (signal) => getListingReport(api, id, signal),
    ),
    ...readPolicy,
  };
}

/**
 * One admin listing command per user intent: an identical payload reuses its
 * Idempotency-Key (a manual retry replays the stored result); any change of
 * payload or version is a new command. Never retried automatically. A version
 * conflict re-reads every listing view so the admin sees the latest state;
 * the command itself is never re-sent with the new version.
 */
export function useListingCommand<Input, Output>(
  { api, scope, lifecycle }: Ctx,
  run: (api: BrowserApi, input: Input, command: Command) => Promise<Output>,
) {
  const client = useQueryClient();
  const keys = useIdempotencyKey();
  const refresh = () =>
    client.invalidateQueries({ queryKey: listingKeys.root(scope) });
  const mutation = usePrivateMutation(
    lifecycle,
    async (input: { value: Input; key: string }, assertCurrent) => {
      try {
        return await run(api, input.value, { key: input.key, assertCurrent });
      } catch (error) {
        if (isListingConflict(failureCode(error))) void refresh();
        throw error;
      }
    },
  );
  return {
    mutation,
    submit(value: Input, onSuccess?: (output: Output) => void) {
      const key = keys.for(JSON.stringify(value));
      void mutation.run({ value, key }, async (output) => {
        keys.clear();
        await refresh();
        onSuccess?.(output);
      });
    },
  };
}
