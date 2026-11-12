'use client';

import { useQueryClient } from '@tanstack/react-query';
import type { VideoCommentDecision, VideoCommentStatus } from '@apnatown/shared';
import { privateInfiniteQueryOptions } from '../../../shared/api/private-query';
import { useIdempotencyKey } from '../../../shared/api/idempotency';
import { usePrivateMutation } from '../../../shared/api/use-private-mutation';
import { queryKeys } from '../../../shared/api/query-keys';
import type { AdminContext } from '../AdminShell';
import { decideVideoCommentAdmin, listVideoCommentsAdmin } from './comments-api';

type Context = Pick<AdminContext, 'api' | 'scope' | 'lifecycle' | 'me'>;

export function videoCommentsOptions(
  { api, scope, lifecycle, me }: Context,
  status: VideoCommentStatus,
) {
  return {
    ...privateInfiniteQueryOptions(
      queryKeys.adminVideoComments(scope, me.scopeRevision, status),
      scope.epoch,
      lifecycle,
      (cursor, signal) =>
        listVideoCommentsAdmin(api, status, cursor, signal),
    ),
    staleTime: 5_000,
    retry: false,
  };
}

export function useVideoCommentDecision({
  api,
  scope,
  lifecycle,
}: Context) {
  const client = useQueryClient();
  const keys = useIdempotencyKey();
  const mutation = usePrivateMutation(
    lifecycle,
    async (
      input: {
        id: string;
        videoId: string;
        decision: VideoCommentDecision;
        key: string;
      },
      assertCurrent,
    ) => {
      const result = await decideVideoCommentAdmin(
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
      videoId: string,
      decision: VideoCommentDecision,
      onSuccess: () => void,
    ) {
      const key = keys.for(JSON.stringify({ id, decision }));
      void mutation.run({ id, videoId, decision, key }, async () => {
        keys.clear();
        await Promise.all([
          client.invalidateQueries({
            queryKey: queryKeys.adminVideoCommentsRoot(scope),
          }),
          client.invalidateQueries({
            queryKey: queryKeys.videoCommentsPublic(videoId),
          }),
          client.invalidateQueries({
            queryKey: queryKeys.videoCommentsPrivate(scope, videoId),
          }),
        ]);
        onSuccess();
      });
    },
  };
}
