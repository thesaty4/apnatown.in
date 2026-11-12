'use client';

import { useQueryClient } from '@tanstack/react-query';
import type { ConsentList } from '@apnatown/shared/users';
import { useSession } from '../../shared/auth/SessionProvider';
import { accountScope, queryKeys } from '../../shared/api/query-keys';
import { reconcilePrivate } from '../../shared/api/private-query';
import { usePrivateMutation } from '../../shared/api/use-private-mutation';
import { ApiFailure, failureCode } from '../../shared/api/result';
import { saveConsent, type ConsentChange } from './consent-api';

/** Only the server-confirmed record enters the cache; nothing is optimistic. */
export function useSaveConsent() {
  const { api, state, epoch, lifecycle } = useSession();
  const client = useQueryClient();
  return usePrivateMutation(
    lifecycle,
    async (change: ConsentChange, assertCurrent) => {
      if (state.kind !== 'ready') throw new ApiFailure('SESSION_EXPIRED');
      const key = queryKeys.consents(accountScope(state.data, epoch));
      try {
        const record = await saveConsent(api, change, assertCurrent);
        const current = client.getQueryData<ConsentList>(key);
        if (current)
          await reconcilePrivate(
            client,
            key,
            {
              ...current,
              items: current.items.map((item) =>
                item.purpose === record.purpose &&
                item.channel === record.channel
                  ? record
                  : item,
              ),
            },
            assertCurrent,
          );
        else await client.invalidateQueries({ queryKey: key, exact: true });
        return record;
      } catch (error) {
        // The notice moved on: reload the current version for the user to review.
        if (failureCode(error) === 'CONSENT_NOTICE_INVALID') {
          assertCurrent();
          void client.invalidateQueries({ queryKey: key, exact: true });
        }
        throw error;
      }
    },
  );
}
