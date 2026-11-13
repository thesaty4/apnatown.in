'use client';

import type { DataRequestType } from '@apnatown/shared/users';
import { useSession } from '../../shared/auth/SessionProvider';
import { usePrivateMutation } from '../../shared/api/use-private-mutation';
import { createDataRequest } from './data-request-api';

/** Nothing optimistic: progress is read back from the owner status query. The
 * caller resets the mutation after taking its result so the one-time deletion
 * capability does not linger in the mutation cache. */
export function useCreateDataRequest() {
  const { api, lifecycle } = useSession();
  return usePrivateMutation(
    lifecycle,
    (input: { type: DataRequestType; key: string }, assertCurrent) =>
      createDataRequest(api, input.type, input.key, assertCurrent),
  );
}
