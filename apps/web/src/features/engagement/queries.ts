'use client';

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { VideoCommentCreate } from '@apnatown/shared';
import { accountScope, queryKeys } from '../../shared/api/query-keys';
import { privateInfiniteQueryOptions } from '../../shared/api/private-query';
import { useIdempotencyKey } from '../../shared/api/idempotency';
import { usePrivateMutation } from '../../shared/api/use-private-mutation';
import { useSession } from '../../shared/auth/SessionProvider';
import { createVideoComment, deleteVideoComment, listVideoComments } from './api';

export function useVideoComments(videoId: string) {
  const { api, lifecycle, state, epoch } = useSession();
  const scope =
    state.kind === 'ready' ? accountScope(state.data, epoch) : null;
  const queryKey = scope
    ? queryKeys.videoCommentsPrivate(scope, videoId)
    : queryKeys.videoCommentsPublic(videoId);
  return {
    query: useInfiniteQuery({
      ...privateInfiniteQueryOptions(
        queryKey,
        epoch,
        lifecycle,
        (cursor, signal) => listVideoComments(api, videoId, cursor, signal),
      ),
      staleTime: 30_000,
      retry: false,
    }),
    api,
    lifecycle,
    scope,
  };
}

export function useVideoCommentActions(videoId: string) {
  const { api, lifecycle, state, epoch } = useSession();
  const scope =
    state.kind === 'ready' ? accountScope(state.data, epoch) : null;
  const client = useQueryClient();
  const keys = useIdempotencyKey();
  const queryKey = scope
    ? queryKeys.videoCommentsPrivate(scope, videoId)
    : queryKeys.videoCommentsPublic(videoId);

  const create = usePrivateMutation(
    lifecycle,
    async (
      input: { body: VideoCommentCreate; key: string },
      assertCurrent,
    ) => {
      const comment = await createVideoComment(api, videoId, input.body, {
        key: input.key,
        assertCurrent,
      });
      assertCurrent();
      return comment;
    },
  );
  const remove = usePrivateMutation(
    lifecycle,
    async (input: { id: string }, assertCurrent) => {
      await deleteVideoComment(api, videoId, input.id, assertCurrent);
      assertCurrent();
    },
  );

  return {
    create,
    remove,
    submit(body: VideoCommentCreate, onSuccess: () => void) {
      const key = keys.for(JSON.stringify(body));
      void create.run({ body, key }, async () => {
        keys.clear();
        await client.invalidateQueries({ queryKey });
        onSuccess();
      });
    },
    delete(id: string, onSuccess: () => void) {
      void remove.run({ id }, async () => {
        await client.invalidateQueries({ queryKey });
        onSuccess();
      });
    },
  };
}
