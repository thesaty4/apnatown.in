import 'server-only';
import { createPrivateServerApi } from '../../shared/api/server';
import { hydrateResource } from '../../shared/api/hydration';
import { accountScope } from '../../shared/api/query-keys';
import { resource } from '../../shared/api/result';
import { readSession } from '../../shared/auth/server';
import { getNotificationPreferences, listNotifications } from './api';
import { notificationKeys, type NotificationRole } from './keys';

/** First feed page under the client's exact infinite key (no second GET). */
export async function readNotificationFeed(
  role: NotificationRole,
  { requireRole = false }: { requireRole?: boolean } = {},
) {
  const session = await readSession();
  if (
    session.kind !== 'ready' ||
    (requireRole && !session.data.roles.includes(role))
  )
    return { initial: { mutations: [], queries: [] } };
  const api = await createPrivateServerApi();
  const result = await resource(async () => ({
    pages: [await listNotifications(api, role)],
    pageParams: [null],
  }));
  return {
    owner: session.data.userId,
    initial: await hydrateResource(
      notificationKeys.feed(accountScope(session.data, 0), role),
      result,
    ),
  };
}

/** Channel preferences for `/account/preferences` (S-CUST-23). */
export async function readNotificationPreferences() {
  const session = await readSession();
  if (session.kind !== 'ready') return undefined;
  const api = await createPrivateServerApi();
  const result = await resource(() => getNotificationPreferences(api));
  return hydrateResource(
    notificationKeys.preferences(accountScope(session.data, 0)),
    result,
  );
}
