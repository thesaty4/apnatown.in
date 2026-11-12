'use client';

import { useQueryClient } from '@tanstack/react-query';
import type { components } from '@apnatown/api-client';
import { useSession } from '../auth/SessionProvider';
import { ApiFailure } from '../api/result';
import { accountScope, queryKeys } from '../api/query-keys';
import { reconcilePrivate } from '../api/private-query';
import { usePrivateMutation } from '../api/use-private-mutation';
import { savePreferences } from './preferences-api';

/** Shared public integration for account form, shell toggle and login. */
export function useSavePreferences() {
  const { api, state, epoch, lifecycle } = useSession();
  const client = useQueryClient();
  return usePrivateMutation(
    lifecycle,
    async (
      body: components['schemas']['UpdatePreferencesDto'],
      assertCurrent,
    ) => {
      if (state.kind !== 'ready') throw new ApiFailure('SESSION_EXPIRED');
      const next = await savePreferences(api, body, assertCurrent);
      await reconcilePrivate(
        client,
        queryKeys.preferences(accountScope(state.data, epoch)),
        next,
        assertCurrent,
      );
      return next;
    },
  );
}
