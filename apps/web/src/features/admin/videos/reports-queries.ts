'use client';

import { useQueryClient } from '@tanstack/react-query';
import type { MediaReportDecision } from '@apnatown/shared';
import {
  privateInfiniteQueryOptions,
  privateQueryOptions,
} from '../../../shared/api/private-query';
import { useIdempotencyKey } from '../../../shared/api/idempotency';
import { usePrivateMutation } from '../../../shared/api/use-private-mutation';
import { queryKeys } from '../../../shared/api/query-keys';
import type { AdminContext } from '../AdminShell';
import {
  decideMediaReport,
  listMediaReports,
  type MediaReportKind,
} from './reports-api';

type Context = Pick<AdminContext, 'api' | 'scope' | 'lifecycle' | 'me'>;

export function mediaReportsOptions(
  { api, scope, lifecycle, me }: Context,
  targetKind: MediaReportKind,
) {
  return {
    ...privateInfiniteQueryOptions(
      queryKeys.adminMediaReports(scope, me.scopeRevision, targetKind),
      scope.epoch,
      lifecycle,
      (cursor, signal) => listMediaReports(api, targetKind, cursor, signal),
    ),
    staleTime: 5_000,
    retry: false,
  };
}

/** Counts only (one-item page) for the Reported tab chip on other tabs. */
export function mediaReportCountsOptions({
  api,
  scope,
  lifecycle,
  me,
}: Context) {
  return {
    ...privateQueryOptions(
      queryKeys.adminMediaReportCounts(scope, me.scopeRevision),
      scope.epoch,
      lifecycle,
      async (signal) =>
        (await listMediaReports(api, 'all', undefined, signal, 1)).counts,
    ),
    staleTime: 5_000,
    retry: false,
  };
}

export function useMediaReportDecision({
  api,
  scope,
  lifecycle,
}: Context) {
  const client = useQueryClient();
  const keys = useIdempotencyKey();
  const mutation = usePrivateMutation(
    lifecycle,
    async (
      input: { id: string; decision: MediaReportDecision; key: string },
      assertCurrent,
    ) => {
      const result = await decideMediaReport(
        api,
        input.id,
        input.decision,
        { key: input.key, assertCurrent },
      );
      assertCurrent();
      return result;
    },
  );

  return {
    mutation,
    submit(
      id: string,
      decision: MediaReportDecision,
      onSuccess: () => void,
    ) {
      const key = keys.for(JSON.stringify({ id, decision }));
      void mutation.run({ id, decision, key }, async () => {
        keys.clear();
        // Queue pages + counts, and video tab counts/statuses (video removal).
        await Promise.all([
          client.invalidateQueries({
            queryKey: queryKeys.adminMediaReportsRoot(scope),
          }),
          client.invalidateQueries({
            queryKey: queryKeys.adminVideoModerationRoot(scope),
          }),
        ]);
        onSuccess();
      });
    },
  };
}
