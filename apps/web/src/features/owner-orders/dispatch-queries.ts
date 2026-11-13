'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { BusinessKind } from '@apnatown/shared/businesses';
import type { AccountScope } from '../../shared/api/query-keys';
import { privateQueryOptions } from '../../shared/api/private-query';
import { failureCode, retryTransientRead } from '../../shared/api/result';
import { useIdempotencyKey } from '../../shared/api/idempotency';
import { usePrivateMutation } from '../../shared/api/use-private-mutation';
import { businessKeys, useOwnerContext } from '../businesses/queries';
import {
  listRiderCandidates,
  runDispatchCommand,
  type DispatchCommand,
} from './dispatch-api';
import { DISPATCH_REFRESH_CODES } from './errors';
import { ownerOrderKeys } from './queries';

const riderKey = (scope: AccountScope, kind: BusinessKind, id: string) =>
  [...ownerOrderKeys.detail(scope, kind, id), 'riders'] as const;

/**
 * Rider picker rows (S-VEND-04 "Assign rider"). Availability is only a hint
 * (re-checked on assign), so the list is re-read every time the sheet opens
 * and dropped soon after it closes.
 */
export function useRiderCandidates(
  kind: BusinessKind,
  id: string,
  enabled: boolean,
) {
  const { api, lifecycle, scope } = useOwnerContext();
  return useQuery({
    ...privateQueryOptions(
      scope
        ? riderKey(scope, kind, id)
        : ['private', 'pending', 'business', kind, 'riders', id],
      scope?.epoch ?? 0,
      lifecycle,
      (signal) => listRiderCandidates(api, kind, id, signal),
    ),
    enabled: enabled && scope !== null,
    retry: retryTransientRead,
    staleTime: 0,
    gcTime: 30_000,
  });
}

/**
 * Auto-assign / directed assign. Not optimistic: the order (whose `delivery`
 * block carries the job/offer state) is re-read after success, and after a
 * stale/unavailable rejection together with the picker rows, so the next
 * attempt uses current versions and availability.
 */
export function useDispatchCommand(kind: BusinessKind, id: string) {
  const { api, lifecycle, scope } = useOwnerContext();
  const client = useQueryClient();
  const keys = useIdempotencyKey();
  const refresh = () => {
    if (!scope) return Promise.resolve();
    return Promise.all([
      client.invalidateQueries({
        queryKey: ownerOrderKeys.detail(scope, kind, id),
      }),
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
  };
  const mutation = usePrivateMutation(
    lifecycle,
    async (input: { command: DispatchCommand; key: string }, assertCurrent) => {
      try {
        const state = await runDispatchCommand(
          api,
          kind,
          id,
          input.command,
          input.key,
          assertCurrent,
        );
        assertCurrent();
        await refresh();
        return state;
      } catch (error) {
        if (DISPATCH_REFRESH_CODES.has(failureCode(error))) void refresh();
        throw error;
      }
    },
  );
  return {
    mutation,
    run(command: DispatchCommand, onSuccess?: () => void) {
      const key = keys.for(JSON.stringify(command));
      void mutation.run({ command, key }, () => {
        keys.clear();
        onSuccess?.();
      });
    },
  };
}
