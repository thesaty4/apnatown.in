'use client';

import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { BusinessKind } from '@apnatown/shared/businesses';
import type {
  EnquiryDetail,
  EnquiryStatusResult,
  EnquiryTargetStatus,
} from '@apnatown/shared/services';
import {
  privateInfiniteQueryOptions,
  privateQueryOptions,
} from '../../shared/api/private-query';
import { queryKeys } from '../../shared/api/query-keys';
import { usePrivateMutation } from '../../shared/api/use-private-mutation';
import { businessKeys, useOwnerContext } from '../businesses/queries';
import {
  getEnquiry,
  listEnquiries,
  patchEnquiryStatus,
  type InboxFilters,
} from './api';

const pending = (kind: BusinessKind, ...part: string[]) =>
  ['private', 'pending', 'business', kind, 'enquiries', ...part] as const;

/** Keyset inbox pages; a status/search/kind/account change is a new key, so
 * pages read under another filter or owner context are never mixed. */
export function useEnquiryInbox(
  kind: BusinessKind,
  filters: InboxFilters,
  enabled: boolean,
) {
  const { api, lifecycle, scope } = useOwnerContext();
  const status = filters.status ?? 'all';
  return useInfiniteQuery({
    ...privateInfiniteQueryOptions(
      scope
        ? queryKeys.enquiryInbox(scope, kind, status, filters.query)
        : pending(kind, 'inbox', status),
      scope?.epoch ?? 0,
      lifecycle,
      (cursor, signal) => listEnquiries(api, kind, filters, cursor, signal),
    ),
    enabled: enabled && scope !== null,
  });
}

/** Owner detail with the decrypted phone: re-read on every mount, never kept
 * once no screen shows it. */
export function useEnquiry(kind: BusinessKind, id: string, enabled: boolean) {
  const { api, lifecycle, scope } = useOwnerContext();
  return useQuery({
    ...privateQueryOptions(
      scope ? queryKeys.enquiry(scope, kind, id) : pending(kind, 'detail', id),
      scope?.epoch ?? 0,
      lifecycle,
      (signal) => getEnquiry(api, kind, id, signal),
    ),
    enabled: enabled && scope !== null,
    staleTime: 0,
    gcTime: 60_000,
  });
}

/**
 * Status command with `expectedVersion`. Not optimistic: buttons stay disabled
 * until the server answers, then the authoritative result is merged into the
 * detail and every inbox page/count and the overview summary are re-read.
 */
export function useEnquiryStatus(kind: BusinessKind, id: string) {
  const { api, lifecycle, scope } = useOwnerContext();
  const client = useQueryClient();
  const mutation = usePrivateMutation(
    lifecycle,
    (
      input: { status: EnquiryTargetStatus; expectedVersion: number },
      assertCurrent,
    ) => patchEnquiryStatus(api, kind, id, input, assertCurrent),
  );
  return {
    mutation,
    run(
      input: { status: EnquiryTargetStatus; expectedVersion: number },
      onSuccess?: (result: EnquiryStatusResult) => void,
    ) {
      void mutation.run(input, async (result) => {
        if (!scope) return;
        const detailKey = queryKeys.enquiry(scope, kind, id);
        await client.cancelQueries({ queryKey: detailKey, exact: true });
        client.setQueryData<EnquiryDetail>(detailKey, (current) =>
          current
            ? {
                ...current,
                status: result.status,
                version: result.version,
                convertedAt: result.convertedAt,
                updatedAt: result.updatedAt,
                allowedStatuses: result.allowedStatuses,
              }
            : current,
        );
        onSuccess?.(result);
        await Promise.all([
          client.invalidateQueries({
            queryKey: detailKey,
            exact: true,
            refetchType: 'none',
          }),
          client.invalidateQueries({
            queryKey: [...queryKeys.enquiriesRoot(scope, kind), 'inbox'],
          }),
          client.invalidateQueries({
            queryKey: businessKeys.overview(scope, kind),
          }),
        ]);
      });
    },
  };
}
