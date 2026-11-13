'use client';

import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import type { BusinessKind } from '@apnatown/shared/businesses';
import type {
  ServiceOwner,
  ServiceOwnerCreate,
  ServiceOwnerPage,
  ServiceOwnerPatch,
} from '@apnatown/shared/services';
import { useIdempotencyKey } from '../../../shared/api/idempotency';
import { privateInfiniteQueryOptions } from '../../../shared/api/private-query';
import { queryKeys } from '../../../shared/api/query-keys';
import { usePrivateMutation } from '../../../shared/api/use-private-mutation';
import { businessKeys, useOwnerContext } from '../../businesses/queries';
import {
  createOwnerService,
  deleteOwnerService,
  listOwnerServices,
  updateOwnerService,
} from './api';

type Pages = InfiniteData<ServiceOwnerPage, string | null>;

const pending = (kind: BusinessKind) =>
  ['private', 'pending', 'business', kind, 'services', 'list'] as const;

/** Every owner service (both statuses), keyset pages under the account scope. */
export function useOwnerServices(kind: BusinessKind, enabled: boolean) {
  const { api, lifecycle, scope } = useOwnerContext();
  return useInfiniteQuery({
    ...privateInfiniteQueryOptions(
      scope ? queryKeys.serviceList(scope, kind, 'all') : pending(kind),
      scope?.epoch ?? 0,
      lifecycle,
      (cursor, signal) =>
        listOwnerServices(api, kind, undefined, cursor, signal),
    ),
    enabled: enabled && scope !== null,
  });
}

/** Merge an authoritative write result into the cached list pages. */
function patchPages(
  data: Pages | undefined,
  change: { upsert: ServiceOwner } | { removeId: string },
): Pages | undefined {
  if (!data) return data;
  if ('removeId' in change)
    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        items: page.items.filter((item) => item.id !== change.removeId),
      })),
    };
  const next = change.upsert;
  const exists = data.pages.some((page) =>
    page.items.some((item) => item.id === next.id),
  );
  return {
    ...data,
    pages: data.pages.map((page, index) => ({
      ...page,
      items: exists
        ? page.items.map((item) => (item.id === next.id ? next : item))
        : index === 0
          ? [next, ...page.items]
          : page.items,
    })),
  };
}

/** Seed the confirmed result, then mark every services list and the owner
 * overview (counts, completeness) stale for the next read. */
function useReconcile(kind: BusinessKind) {
  const { scope } = useOwnerContext();
  const client = useQueryClient();
  return async (change: { upsert: ServiceOwner } | { removeId: string }) => {
    if (!scope) return;
    const listKey = queryKeys.serviceList(scope, kind, 'all');
    await client.cancelQueries({ queryKey: listKey, exact: true });
    client.setQueryData<Pages>(listKey, (data) => patchPages(data, change));
    await Promise.all([
      client.invalidateQueries({
        queryKey: queryKeys.servicesRoot(scope, kind),
        refetchType: 'none',
      }),
      client.invalidateQueries({
        queryKey: businessKeys.overview(scope, kind),
      }),
    ]);
  };
}

/** Create / full-form update from the editor sheet. One idempotency key per
 * exact payload: a retry of the same save replays, an edited form is new. */
export function useSaveService(kind: BusinessKind) {
  const { api, lifecycle } = useOwnerContext();
  const keys = useIdempotencyKey();
  const reconcile = useReconcile(kind);
  const mutation = usePrivateMutation(
    lifecycle,
    (
      input:
        | { mode: 'create'; body: ServiceOwnerCreate }
        | { mode: 'update'; id: string; body: ServiceOwnerPatch },
      assertCurrent,
    ) => {
      const key = keys.for(JSON.stringify(input));
      return input.mode === 'create'
        ? createOwnerService(api, kind, input.body, key, assertCurrent)
        : updateOwnerService(
            api,
            kind,
            input.id,
            input.body,
            key,
            assertCurrent,
          );
    },
  );
  return {
    mutation,
    save(
      input:
        | { mode: 'create'; body: ServiceOwnerCreate }
        | { mode: 'update'; id: string; body: ServiceOwnerPatch },
      onSaved: (service: ServiceOwner) => void,
    ) {
      void mutation.run(input, async (service) => {
        keys.clear();
        onSaved(service);
        await reconcile({ upsert: service });
      });
    },
  };
}

/** Row status switch (active ↔ paused). Not optimistic: the switch stays
 * disabled until the server confirms, then shows the authoritative state. */
export function useServiceStatus(kind: BusinessKind) {
  const { api, lifecycle } = useOwnerContext();
  const keys = useIdempotencyKey();
  const reconcile = useReconcile(kind);
  const mutation = usePrivateMutation(
    lifecycle,
    (
      input: { service: ServiceOwner; status: ServiceOwner['status'] },
      check,
    ) => {
      const body = {
        status: input.status,
        expectedVersion: input.service.version,
      };
      const key = keys.for(`${input.service.id}:${JSON.stringify(body)}`);
      return updateOwnerService(api, kind, input.service.id, body, key, check);
    },
  );
  return {
    mutation,
    run(
      service: ServiceOwner,
      status: ServiceOwner['status'],
      onDone: (service: ServiceOwner) => void,
    ) {
      void mutation.run({ service, status }, async (result) => {
        keys.clear();
        onDone(result);
        await reconcile({ upsert: result });
      });
    },
  };
}

export function useDeleteService(kind: BusinessKind) {
  const { api, lifecycle } = useOwnerContext();
  const keys = useIdempotencyKey();
  const reconcile = useReconcile(kind);
  const mutation = usePrivateMutation(
    lifecycle,
    (service: ServiceOwner, check) =>
      deleteOwnerService(
        api,
        kind,
        service.id,
        service.version,
        keys.for(`${service.id}:${service.version}`),
        check,
      ),
  );
  return {
    mutation,
    run(service: ServiceOwner, onDone: () => void) {
      void mutation.run(service, async (result) => {
        keys.clear();
        onDone();
        await reconcile({ removeId: result.id });
      });
    },
  };
}
