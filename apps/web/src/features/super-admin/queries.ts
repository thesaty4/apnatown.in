'use client';

import { useEffect } from 'react';
import {
  queryOptions,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  privateInfiniteQueryOptions,
  privateQueryOptions,
} from '../../shared/api/private-query';
import { queryKeys } from '../../shared/api/query-keys';
import { ApiFailure, failureCode } from '../../shared/api/result';
import { useIdempotencyKey } from '../../shared/api/idempotency';
import { usePrivateMutation } from '../../shared/api/use-private-mutation';
import type { BrowserApi } from '../../shared/api/browser';
import { isDenied, useAdmin, type AdminContext } from '../admin';
import {
  getAdminImpact,
  listAdmins,
  listRoles,
  type AdminFilters,
  type Command,
} from './api';

type Ctx = Pick<AdminContext, 'api' | 'scope' | 'lifecycle'>;

/** Free-text search is passed to the request only; the key holds a revision. */
export function adminsOptions(
  { api, scope, lifecycle }: Ctx,
  filters: AdminFilters,
  search: { q: string; revision: number },
) {
  return privateInfiniteQueryOptions(
    queryKeys.admins(scope, filters, search.revision),
    scope.epoch,
    lifecycle,
    (cursor, signal) =>
      listAdmins(api, { ...filters, q: search.q || undefined }, cursor, signal),
  );
}

export function impactOptions({ api, scope, lifecycle }: Ctx, id: string) {
  return queryOptions({
    ...privateQueryOptions(
      queryKeys.adminImpact(scope, id),
      scope.epoch,
      lifecycle,
      (signal) => getAdminImpact(api, id, signal),
    ),
    // Impact is a pre-confirmation snapshot; always re-read when shown.
    staleTime: 0,
  });
}

export function rolesOptions({ api, scope, lifecycle }: Ctx) {
  return privateInfiniteQueryOptions(
    queryKeys.roles(scope),
    scope.epoch,
    lifecycle,
    (cursor, signal) => listRoles(api, cursor, signal),
  );
}

/** Every role (pages of 50) for pickers; role counts are small and bounded. */
export function useAllRoles() {
  const context = useAdmin();
  const query = useInfiniteQuery(rolesOptions(context));
  const { hasNextPage, isFetchingNextPage, isError, fetchNextPage } = query;
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && !isError) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, isError, fetchNextPage]);
  return {
    query,
    roles: query.data?.pages.flatMap((page) => page.items) ?? [],
  };
}

const refreshCodes = new Set([
  'ADMIN_VERSION_CONFLICT',
  'ROLE_VERSION_CONFLICT',
  'ADMIN_NOT_FOUND',
  'ROLE_NOT_FOUND',
  'ROLE_IN_USE',
  'ROLE_SYSTEM_LOCKED',
  'SETTINGS_VERSION_CONFLICT',
  'FEATURE_NOT_AVAILABLE',
  'LEGAL_PAGE_NOT_FOUND',
  'GEO_VERSION_CONFLICT',
  'CITY_NOT_FOUND',
  'CITY_TRANSITION_INVALID',
  'ZONE_NOT_FOUND',
  'CATALOG_VERSION_CONFLICT',
  'CATEGORY_NOT_FOUND',
  'SUBCATEGORY_NOT_FOUND',
  'SUGGESTION_NOT_FOUND',
  'SUGGESTION_STATE_INVALID',
  'KEYWORD_MAPPING_NOT_FOUND',
  'CATALOG_HOME_SECTION_NOT_FOUND',
  'CATALOG_HOME_SECTION_CONFLICT',
  'CATALOG_HOME_SECTION_STATE_INVALID',
]);

/** One super-admin command. No automatic retry; the caller supplies the
 * idempotency key (stable per payload, reused on a manual retry). Success
 * invalidates every admin read for this scope (lists, counts, roles, me);
 * conflicts refetch the latest version while the caller keeps its draft. */
export function useSuperCommand<Input, Output>(
  operation: (
    api: BrowserApi,
    input: Input,
    command: Command,
  ) => Promise<Output>,
) {
  const context = useAdmin();
  const client = useQueryClient();
  const queryKey = queryKeys.admin(context.scope);
  return usePrivateMutation(
    context.lifecycle,
    async (input: { body: Input; key: string }, assertCurrent) => {
      try {
        const output = await operation(context.api, input.body, {
          key: input.key,
          assertCurrent,
        });
        assertCurrent();
        await client.invalidateQueries({ queryKey });
        return output;
      } catch (error) {
        const code = failureCode(error);
        if (isDenied(code)) context.recheck();
        if (refreshCodes.has(code)) void client.invalidateQueries({ queryKey });
        throw error;
      }
    },
  );
}

/** A command bound to one idempotency key per payload: an unchanged manual
 * retry replays, any edit (including a refreshed version) is a new command. */
export function useIdempotentCommand<Body, Output>(
  operation: (api: BrowserApi, body: Body, command: Command) => Promise<Output>,
) {
  const mutation = useSuperCommand(operation);
  const keys = useIdempotencyKey();
  return {
    mutation,
    busy: mutation.isPending,
    code: mutation.isError ? failureCode(mutation.error) : undefined,
    fields: mutation.error instanceof ApiFailure ? mutation.error.fields : [],
    submit(body: Body, onSuccess: (output: Output) => void) {
      const key = keys.for(JSON.stringify(body));
      void mutation.run({ body, key }, (output) => {
        keys.clear();
        onSuccess(output);
      });
    },
  };
}
