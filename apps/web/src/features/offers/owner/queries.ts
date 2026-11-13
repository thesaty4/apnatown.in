'use client';

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { BusinessKind } from '@apnatown/shared/businesses';
import type { AccountScope } from '../../../shared/api/query-keys';
import { useIdempotencyKey } from '../../../shared/api/idempotency';
import { privateInfiniteQueryOptions } from '../../../shared/api/private-query';
import { retryTransientRead } from '../../../shared/api/result';
import { usePrivateMutation } from '../../../shared/api/use-private-mutation';
import { businessKeys, useOwnerContext } from '../../businesses/queries';
import {
  listOwnerOffers,
  runOfferCommand,
  type OfferCommand,
  type OfferStatusFilter,
} from './api';

export const ownerOfferKeys = {
  root: (scope: AccountScope, kind: BusinessKind) =>
    [...businessKeys.all(scope, kind), 'offers'] as const,
  list: (scope: AccountScope, kind: BusinessKind, status: OfferStatusFilter) =>
    [...ownerOfferKeys.root(scope, kind), status] as const,
};

export function useOwnerOffers(kind: BusinessKind, status: OfferStatusFilter, enabled: boolean) {
  const { api, lifecycle, scope } = useOwnerContext();
  return useInfiniteQuery({
    ...privateInfiniteQueryOptions(
      scope
        ? ownerOfferKeys.list(scope, kind, status)
        : ['private', 'pending', 'business', kind, 'offers'],
      scope?.epoch ?? 0,
      lifecycle,
      (cursor, signal) => listOwnerOffers(api, kind, status, cursor, signal),
    ),
    enabled: enabled && scope !== null,
    retry: retryTransientRead,
  });
}

type CommandInput =
  | { type: 'create'; offer: Extract<OfferCommand, { type: 'create' }>['offer'] }
  | Exclude<OfferCommand, { type: 'create' }>;

/** Not optimistic: every status filter page is re-read after success. */
export function useOfferCommand(kind: BusinessKind) {
  const { api, lifecycle, scope } = useOwnerContext();
  const client = useQueryClient();
  const keys = useIdempotencyKey();
  return usePrivateMutation(lifecycle, async (input: CommandInput, assertCurrent) => {
    const command: OfferCommand =
      input.type === 'create'
        ? { ...input, key: keys.for(JSON.stringify(input.offer)) }
        : input;
    const result = await runOfferCommand(api, kind, command, assertCurrent);
    if (input.type === 'create') keys.clear();
    if (scope) await client.invalidateQueries({ queryKey: ownerOfferKeys.root(scope, kind) });
    return result;
  });
}
