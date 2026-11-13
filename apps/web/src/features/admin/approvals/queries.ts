'use client';

import { queryOptions, useQueryClient } from '@tanstack/react-query';
import type {
  AdminApprovalType,
  AdminBusinessApprovalType,
} from '@apnatown/shared/admin';
import type {
  BusinessDecision,
  BusinessDecisionResult,
} from '@apnatown/shared/businesses';
import {
  privateInfiniteQueryOptions,
  privateQueryOptions,
} from '../../../shared/api/private-query';
import { queryKeys } from '../../../shared/api/query-keys';
import { useIdempotencyKey } from '../../../shared/api/idempotency';
import { usePrivateMutation } from '../../../shared/api/use-private-mutation';
import type { AdminContext } from '../AdminShell';
import {
  decideApproval,
  getApprovalDetail,
  getApprovalDocuments,
  listApprovals,
} from './api';
import type { ApprovalStatus } from './filters';

type Ctx = Pick<AdminContext, 'api' | 'scope' | 'lifecycle' | 'me'>;

/** The SSR-hydrated first page counts as the initial read for this short
 * hand-off only; afterwards mount, focus, reconnect and filter changes re-read
 * (the endpoints are private, no-store). Freshness never grants access. */
export const APPROVALS_SSR_HANDOFF_MS = 5_000;

/** Keyset queue pages. A type/status/scope change is a new key, so pages read
 * under another filter or grant are never mixed. */
export function approvalQueueOptions(
  { api, scope, lifecycle, me }: Ctx,
  type: AdminApprovalType,
  status: ApprovalStatus,
) {
  return {
    ...privateInfiniteQueryOptions(
      queryKeys.adminApprovalQueue(scope, me.scopeRevision, type, status),
      scope.epoch,
      lifecycle,
      (cursor, signal) => listApprovals(api, type, status, cursor, signal),
    ),
    staleTime: APPROVALS_SSR_HANDOFF_MS,
  };
}

/** Detail pages: page 0 carries the current application + newest history;
 * later pages only add older history entries. All pages refetch together, so
 * the application fields and `version` always come from a fresh page 0. */
export function approvalDetailOptions(
  { api, scope, lifecycle, me }: Ctx,
  type: AdminBusinessApprovalType,
  id: string,
) {
  return {
    ...privateInfiniteQueryOptions(
      queryKeys.adminApprovalDetail(scope, me.scopeRevision, type, id),
      scope.epoch,
      lifecycle,
      async (cursor, signal) => {
        const detail = await getApprovalDetail(api, type, id, cursor, signal);
        return { detail, nextCursor: detail.history.nextCursor };
      },
    ),
    staleTime: APPROVALS_SSR_HANDOFF_MS,
  };
}

/** Document metadata is re-read on every mount; never cached across views. */
export function approvalDocumentsOptions(
  { api, scope, lifecycle, me }: Ctx,
  id: string,
) {
  return queryOptions({
    ...privateQueryOptions(
      queryKeys.adminApprovalDocuments(scope, me.scopeRevision, id),
      scope.epoch,
      lifecycle,
      (signal) => getApprovalDocuments(api, id, signal),
    ),
    staleTime: 0,
    gcTime: 0,
  });
}

/**
 * One decision command per user intent: the identical payload reuses its
 * Idempotency-Key (safe manual retry replays the stored result); any change of
 * action, reason or version is a new command. Never retried automatically.
 */
export function useApprovalDecision(context: Ctx) {
  const { api, scope, lifecycle } = context;
  const client = useQueryClient();
  const keys = useIdempotencyKey();
  const mutation = usePrivateMutation(
    lifecycle,
    async (
      input: { id: string; decision: BusinessDecision; key: string },
      assertCurrent,
    ) =>
      decideApproval(api, input.id, input.decision, {
        key: input.key,
        assertCurrent,
      }),
  );

  return {
    mutation,
    submit(
      id: string,
      decision: BusinessDecision,
      onSuccess: (result: BusinessDecisionResult) => void | Promise<void>,
    ) {
      const key = keys.for(JSON.stringify({ id, decision }));
      void mutation.run({ id, decision, key }, async (result) => {
        keys.clear();
        // Queue, detail, history and documents of every type/status; inactive
        // queues are marked stale and re-read on their next mount.
        await client.invalidateQueries({
          queryKey: queryKeys.adminApprovalsRoot(scope),
        });
        await onSuccess(result);
      });
    },
    /** Oldest remaining pending application of this type, read fresh after the
     * decision (never inferred from the stale list). */
    async nextPending(type: AdminBusinessApprovalType, after: string) {
      try {
        const data = await client.fetchInfiniteQuery(
          approvalQueueOptions(context, type, 'pending'),
        );
        return data.pages
          .flatMap((page) => page.items)
          .find((item) => item.id !== after && item.status === 'pending');
      } catch {
        return undefined;
      }
    },
  };
}
