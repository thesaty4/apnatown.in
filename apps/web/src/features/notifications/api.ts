import { z } from 'zod';
import {
  NotificationPageSchema,
  NotificationPreferencesSchema,
  NotificationUnreadCountSchema,
  NotificationUnsubscribeMarketingResultSchema,
  type NotificationConsentAcknowledgementSchema,
  type NotificationPreferenceKey,
} from '@apnatown/shared/notifications';
import type { BrowserApi } from '../../shared/api/browser';
import { unwrap } from '../../shared/api/result';
import type { NotificationRole } from './keys';

type Reader = Pick<BrowserApi, 'GET'>;
const PAGE_LIMIT = 20;

/** Wire body for PUT /notifications/preferences: only the changed key(s). */
export type PreferencesBody = {
  expectedVersion: number;
  consentAcknowledgements?: z.infer<
    typeof NotificationConsentAcknowledgementSchema
  >[];
} & { [K in NotificationPreferenceKey]?: boolean };

export async function listNotifications(
  api: Reader,
  role: NotificationRole,
  cursor?: string,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/notifications', {
      params: {
        query: { role, limit: PAGE_LIMIT, ...(cursor && { cursor }) },
      },
      ...(signal && { signal }),
    }),
    NotificationPageSchema,
  );
}

export async function getUnreadCount(
  api: Reader,
  role: NotificationRole,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/notifications/unread-count', {
      params: { query: { role } },
      ...(signal && { signal }),
    }),
    NotificationUnreadCountSchema,
  );
}

export async function getNotificationPreferences(
  api: Reader,
  signal?: AbortSignal,
) {
  return unwrap(
    await api.GET('/notifications/preferences', { ...(signal && { signal }) }),
    NotificationPreferencesSchema,
  );
}

/** 204 on success. CSRF/Origin come from the session transport. */
export async function markNotificationRead(
  api: BrowserApi,
  id: string,
  assertCurrent: () => void,
) {
  const header = await api.mutationHeaders();
  assertCurrent();
  unwrap(
    await api.POST('/notifications/{id}/read', {
      params: { header, path: { id } },
    }),
    z.unknown(),
  );
}

/** 204 on success; only the current authorized role's items change. */
export async function markAllNotificationsRead(
  api: BrowserApi,
  role: NotificationRole,
  assertCurrent: () => void,
) {
  const header = await api.mutationHeaders();
  assertCurrent();
  unwrap(
    await api.POST('/notifications/read-all', {
      params: { header, query: { role } },
    }),
    z.unknown(),
  );
}

/** Sends only the changed allow-listed key(s), never a blanket payload. */
export async function updateNotificationPreferences(
  api: BrowserApi,
  body: PreferencesBody,
  assertCurrent: () => void,
) {
  const header = await api.mutationHeaders();
  assertCurrent();
  return unwrap(
    await api.PUT('/notifications/preferences', { params: { header }, body }),
    NotificationPreferencesSchema,
  );
}

export async function unsubscribeMarketing(
  api: BrowserApi,
  input: { expectedVersion: number; key: string },
  assertCurrent: () => void,
) {
  const header = {
    ...(await api.mutationHeaders()),
    'Idempotency-Key': input.key,
  };
  assertCurrent();
  return unwrap(
    await api.POST('/notifications/preferences/unsubscribe-marketing', {
      params: { header },
      body: { expectedVersion: input.expectedVersion },
    }),
    NotificationUnsubscribeMarketingResultSchema,
  );
}
