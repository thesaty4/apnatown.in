'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationPreferences } from '@apnatown/shared/notifications';
import { useIdempotencyKey } from '../../shared/api/idempotency';
import {
  privateQueryOptions,
  reconcilePrivate,
} from '../../shared/api/private-query';
import { queryKeys } from '../../shared/api/query-keys';
import { failureCode, retryTransientRead } from '../../shared/api/result';
import { usePrivateMutation } from '../../shared/api/use-private-mutation';
import type { OwnContext } from '../users/OwnResource';
import {
  type PreferencesBody,
  getNotificationPreferences,
  unsubscribeMarketing,
  updateNotificationPreferences,
} from './api';
import { notificationKeys } from './keys';

export function useNotificationPreferences({
  api,
  scope,
  lifecycle,
}: OwnContext) {
  return useQuery({
    ...privateQueryOptions(
      notificationKeys.preferences(scope),
      scope.epoch,
      lifecycle,
      (signal) => getNotificationPreferences(api, signal),
    ),
    retry: retryTransientRead,
  });
}

/** Seeds the confirmed DTO and refreshes the users consent ledger view, which
 * shares the same consent rows. A version conflict refetches the latest. */
function useSettle({ scope }: OwnContext) {
  const client = useQueryClient();
  const key = notificationKeys.preferences(scope);
  return {
    async confirmed(next: NotificationPreferences, assertCurrent: () => void) {
      await reconcilePrivate(client, key, next, assertCurrent);
      void client.invalidateQueries({ queryKey: queryKeys.consents(scope) });
    },
    failed(error: unknown, assertCurrent: () => void) {
      assertCurrent();
      if (failureCode(error) === 'NOTIFICATION_VERSION_CONFLICT')
        void client.invalidateQueries({ queryKey: key, exact: true });
    },
  };
}

export function useSaveNotificationPreferences(context: OwnContext) {
  const settle = useSettle(context);
  return usePrivateMutation(
    context.lifecycle,
    async (body: PreferencesBody, assertCurrent) => {
      try {
        const next = await updateNotificationPreferences(
          context.api,
          body,
          assertCurrent,
        );
        await settle.confirmed(next, assertCurrent);
        return next;
      } catch (error) {
        settle.failed(error, assertCurrent);
        throw error;
      }
    },
  );
}

/** One idempotency key per (version) command; a retry of the same
 * confirmation replays instead of withdrawing twice. */
export function useUnsubscribeMarketing(context: OwnContext) {
  const settle = useSettle(context);
  const keys = useIdempotencyKey();
  const mutation = usePrivateMutation(
    context.lifecycle,
    async (expectedVersion: number, assertCurrent) => {
      try {
        const result = await unsubscribeMarketing(
          context.api,
          {
            expectedVersion,
            key: keys.for(`unsubscribe-marketing:${expectedVersion}`),
          },
          assertCurrent,
        );
        await settle.confirmed(result.preferences, assertCurrent);
        keys.clear();
        return result;
      } catch (error) {
        settle.failed(error, assertCurrent);
        throw error;
      }
    },
  );
  return mutation;
}
