'use client';

import type { VideoShareCreate } from '@apnatown/shared';
import { useIdempotencyKey } from '../../shared/api/idempotency';
import { usePrivateMutation } from '../../shared/api/use-private-mutation';
import { useSession } from '../../shared/auth/SessionProvider';
import { createVideoShare } from './shares-api';

export function useVideoShare() {
  const { api, lifecycle } = useSession();
  const keys = useIdempotencyKey();
  const mutation = usePrivateMutation(
    lifecycle,
    async (
      input: { share: VideoShareCreate; key: string },
      assertCurrent,
    ) => {
      await createVideoShare(api, input.share, input.key, assertCurrent);
      assertCurrent();
    },
  );
  return {
    mutation,
    record(share: VideoShareCreate, onSuccess: () => void) {
      const key = keys.for(JSON.stringify(share));
      void mutation.run({ share, key }, () => {
        keys.clear();
        onSuccess();
      });
    },
  };
}
