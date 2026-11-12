'use client';

import { useQueryClient } from '@tanstack/react-query';
import type {
  MediaReportDecision,
  VideoModerationDecision,
  VideoModerationTab,
} from '@apnatown/shared';
import { privateInfiniteQueryOptions } from '../../../shared/api/private-query';
import { useIdempotencyKey } from '../../../shared/api/idempotency';
import { usePrivateMutation } from '../../../shared/api/use-private-mutation';
import { queryKeys } from '../../../shared/api/query-keys';
import type { AdminContext } from '../AdminShell';
import {
  decideVideoModeration,
  decideVideoReport,
  listVideoModeration,
} from './api';

type Context = Pick<AdminContext, 'api' | 'scope' | 'lifecycle' | 'me'>;

export function videoModerationOptions(
  { api, scope, lifecycle, me }: Context,
  tab: VideoModerationTab,
) {
  return {
    ...privateInfiniteQueryOptions(
      queryKeys.adminVideoModeration(scope, me.scopeRevision, tab),
      scope.epoch,
      lifecycle,
      (cursor, signal) => listVideoModeration(api, tab, cursor, signal),
    ),
    staleTime: 5_000,
    retry: false,
  };
}

export function useVideoModerationDecision({
  api,
  scope,
  lifecycle,
}: Context) {
  const client = useQueryClient();
  const keys = useIdempotencyKey();
  const mutation = usePrivateMutation(
    lifecycle,
    async (
      input: { id: string; decision: VideoModerationDecision; key: string },
      assertCurrent,
    ) => {
      const item = await decideVideoModeration(
        api,
        input.id,
        input.decision,
        { key: input.key, assertCurrent },
      );
      assertCurrent();
      return item;
    },
  );

  return {
    mutation,
    submit(
      id: string,
      decision: VideoModerationDecision,
      onSuccess: () => void,
    ) {
      const key = keys.for(JSON.stringify({ id, decision }));
      void mutation.run({ id, decision, key }, async () => {
        keys.clear();
        await client.invalidateQueries({
          queryKey: queryKeys.adminVideoModerationRoot(scope),
        });
        onSuccess();
      });
    },
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
      const result = await decideVideoReport(
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
        await client.invalidateQueries({
          queryKey: queryKeys.adminVideoModerationRoot(scope),
        });
        onSuccess();
      });
    },
  };
}
