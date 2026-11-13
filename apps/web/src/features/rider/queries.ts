'use client';

import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  RiderDisputeInput,
  RiderDraftWrite,
  RiderOnlineState,
  RiderProfile,
  RiderSummary,
} from '@apnatown/shared/delivery';
import { accountScope, type AccountScope } from '../../shared/api/query-keys';
import {
  privateInfiniteQueryOptions,
  privateQueryOptions,
  reconcilePrivate,
} from '../../shared/api/private-query';
import { failureCode, retryTransientRead } from '../../shared/api/result';
import { useIdempotencyKey } from '../../shared/api/idempotency';
import { usePrivateMutation } from '../../shared/api/use-private-mutation';
import { useSession } from '../../shared/auth/SessionProvider';
import {
  createRiderDispute,
  getActiveJob,
  getCurrentOffer,
  getRiderEarnings,
  getRiderHistory,
  getRiderMe,
  getRiderSummary,
  saveRiderDraft,
  setRiderOnline,
  type EarningsRange,
  type HistoryRange,
} from './api';

/**
 * Rider caches are private and partitioned by the account revision (user,
 * roles, approval states, session epoch), so an approval/role change or logout
 * never shows the previous context's data. Freshness (S-RIDE-02..06):
 * profile/summary/offer/active use the 30 s shared default with focus and
 * reconnect refetch; history/earnings pages are keyed by their URL range.
 * Payout instruments never enter a key; only the server-masked text is cached.
 */
export const riderKeys = {
  all: (scope: AccountScope) => ['private', scope, 'rider'] as const,
  me: (scope: AccountScope) => ['private', scope, 'rider', 'me'] as const,
  summary: (scope: AccountScope) =>
    ['private', scope, 'rider', 'summary'] as const,
  offer: (scope: AccountScope) => ['private', scope, 'rider', 'offer'] as const,
  active: (scope: AccountScope) =>
    ['private', scope, 'rider', 'active'] as const,
  history: (scope: AccountScope, range: HistoryRange) =>
    ['private', scope, 'rider', 'history', range] as const,
  earnings: (scope: AccountScope, range: EarningsRange) =>
    ['private', scope, 'rider', 'earnings', range] as const,
};

const pending = (part: string) =>
  ['private', 'pending', 'rider', part] as const;

export function useRiderContext() {
  const { api, lifecycle, state, epoch } = useSession();
  const scope = state.kind === 'ready' ? accountScope(state.data, epoch) : null;
  return { api, lifecycle, scope };
}

export function useRiderMe(enabled = true) {
  const { api, lifecycle, scope } = useRiderContext();
  return useQuery({
    ...privateQueryOptions(
      scope ? riderKeys.me(scope) : pending('me'),
      scope?.epoch ?? 0,
      lifecycle,
      (signal) => getRiderMe(api, signal),
    ),
    enabled: enabled && scope !== null,
    retry: retryTransientRead,
  });
}

export function useRiderSummary(enabled = true) {
  const { api, lifecycle, scope } = useRiderContext();
  return useQuery({
    ...privateQueryOptions(
      scope ? riderKeys.summary(scope) : pending('summary'),
      scope?.epoch ?? 0,
      lifecycle,
      (signal) => getRiderSummary(api, signal),
    ),
    enabled: enabled && scope !== null,
    retry: retryTransientRead,
  });
}

export function useCurrentOffer(enabled = true) {
  const { api, lifecycle, scope } = useRiderContext();
  return useQuery({
    ...privateQueryOptions(
      scope ? riderKeys.offer(scope) : pending('offer'),
      scope?.epoch ?? 0,
      lifecycle,
      (signal) => getCurrentOffer(api, signal),
    ),
    enabled: enabled && scope !== null,
    // Offers are short-lived; focus/reconnect refetch also resyncs countdowns.
    staleTime: 10_000,
    retry: retryTransientRead,
  });
}

/** No active job (404) is an answer and is never retried. */
export function useActiveJob(enabled = true) {
  const { api, lifecycle, scope } = useRiderContext();
  return useQuery({
    ...privateQueryOptions(
      scope ? riderKeys.active(scope) : pending('active'),
      scope?.epoch ?? 0,
      lifecycle,
      (signal) => getActiveJob(api, signal),
    ),
    enabled: enabled && scope !== null,
    retry: retryTransientRead,
  });
}

export const noActiveJob = (error: unknown) =>
  failureCode(error) === 'DELIVERY_JOB_NOT_FOUND';

/** Keyset pages; a range change resets the page set (range is in the key). */
export function useRiderHistory(range: HistoryRange) {
  const { api, lifecycle, scope } = useRiderContext();
  return useInfiniteQuery({
    ...privateInfiniteQueryOptions(
      scope ? riderKeys.history(scope, range) : pending(`history-${range}`),
      scope?.epoch ?? 0,
      lifecycle,
      (cursor, signal) => getRiderHistory(api, range, cursor, signal),
    ),
    enabled: scope !== null,
    retry: retryTransientRead,
  });
}

export function useRiderEarnings(range: EarningsRange) {
  const { api, lifecycle, scope } = useRiderContext();
  return useQuery({
    ...privateQueryOptions(
      scope ? riderKeys.earnings(scope, range) : pending(`earnings-${range}`),
      scope?.epoch ?? 0,
      lifecycle,
      (signal) => getRiderEarnings(api, range, signal),
    ),
    enabled: scope !== null,
    retry: retryTransientRead,
  });
}

/**
 * Online toggle. No optimistic state: the switch shows the server's value, so
 * a rejected change (e.g. active job, not approved) simply stays reverted and
 * the summary/profile capabilities are refetched rather than trusted.
 */
export function useRiderOnline() {
  const client = useQueryClient();
  const { api, lifecycle, scope } = useRiderContext();
  const mutation = usePrivateMutation(
    lifecycle,
    async (online: boolean, assertCurrent) => {
      let state: RiderOnlineState;
      try {
        state = await setRiderOnline(api, online, assertCurrent);
      } catch (error) {
        // A refused change refreshes server capability; nothing is assumed.
        assertCurrent();
        if (scope)
          void client.invalidateQueries({ queryKey: riderKeys.all(scope) });
        throw error;
      }
      if (scope) {
        assertCurrent();
        await client.cancelQueries({ queryKey: riderKeys.summary(scope) });
        assertCurrent();
        client.setQueryData<RiderSummary>(
          riderKeys.summary(scope),
          (current) =>
            current && {
              ...current,
              online: state.online,
              approvalStatus: state.approvalStatus,
            },
        );
        await client.invalidateQueries({ queryKey: riderKeys.all(scope) });
      }
      return state;
    },
  );
  return {
    mutation,
    toggle(online: boolean, onSuccess?: (state: RiderOnlineState) => void) {
      void mutation.run(online, onSuccess);
    },
  };
}

/** Draft save/submit: one key per identical payload (retries replay). */
export function useSaveRiderDraft() {
  const client = useQueryClient();
  const { api, lifecycle, scope } = useRiderContext();
  const keys = useIdempotencyKey();
  const mutation = usePrivateMutation(
    lifecycle,
    async (
      input: { body: RiderDraftWrite; key: string },
      assertCurrent,
    ): Promise<RiderProfile> => {
      const profile = await saveRiderDraft(api, input.body, {
        key: input.key,
        assertCurrent,
      });
      if (scope) {
        await reconcilePrivate(
          client,
          riderKeys.me(scope),
          profile,
          assertCurrent,
        );
        await client.invalidateQueries({
          queryKey: riderKeys.all(scope),
          predicate: (query) => query.queryKey[3] !== 'me',
        });
      }
      return profile;
    },
  );
  return {
    mutation,
    save(
      body: RiderDraftWrite,
      onSuccess?: (profile: RiderProfile) => void | Promise<void>,
    ) {
      const key = keys.for(JSON.stringify(body));
      return mutation.run({ body, key }, async (profile) => {
        keys.clear();
        await onSuccess?.(profile);
      });
    },
  };
}

/** Dispute report. The persisted receipt stays in the mutation result only. */
export function useRiderDispute() {
  const { api, lifecycle } = useRiderContext();
  const keys = useIdempotencyKey();
  const mutation = usePrivateMutation(
    lifecycle,
    (input: { body: RiderDisputeInput; key: string }, assertCurrent) =>
      createRiderDispute(api, input.body, { key: input.key, assertCurrent }),
  );
  return {
    mutation,
    submit(body: RiderDisputeInput) {
      const key = keys.for(JSON.stringify(body));
      return mutation.run({ body, key }, () => keys.clear());
    },
  };
}
