'use client';

import { useQueryClient } from '@tanstack/react-query';
import type { components } from '@apnatown/api-client';
import { useSession } from '../../shared/auth/SessionProvider';
import { accountScope, queryKeys } from '../../shared/api/query-keys';
import { reconcilePrivate } from '../../shared/api/private-query';
import { usePrivateMutation } from '../../shared/api/use-private-mutation';
import { ApiFailure } from '../../shared/api/result';
import { saveProfile } from './api';

export function useSaveProfile() {
  const { api, state, epoch, lifecycle } = useSession();
  const client = useQueryClient();
  return usePrivateMutation(
    lifecycle,
    async (body: components['schemas']['UpdateProfileDto'], assertCurrent) => {
      if (state.kind !== 'ready') throw new ApiFailure('SESSION_EXPIRED');
      const next = await saveProfile(api, body, assertCurrent);
      await reconcilePrivate(
        client,
        queryKeys.profile(accountScope(state.data, epoch)),
        next,
        assertCurrent,
      );
      return next;
    },
  );
}
