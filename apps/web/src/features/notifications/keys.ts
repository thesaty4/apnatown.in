import type { UserRole } from '@apnatown/shared/users';
import type { AccountScope } from '../../shared/api/query-keys';

export type NotificationRole = UserRole;

/** Private, account-scoped and role-keyed: a multi-role user's customer and
 * vendor feeds never share a cache entry. Logout/account change clears every
 * `['private', …]` key through the shared lifecycle. */
export const notificationKeys = {
  root: (scope: AccountScope) => ['private', scope, 'notifications'] as const,
  role: (scope: AccountScope, role: NotificationRole) =>
    [...notificationKeys.root(scope), 'role', role] as const,
  feed: (scope: AccountScope, role: NotificationRole) =>
    [...notificationKeys.role(scope, role), 'feed'] as const,
  unread: (scope: AccountScope, role: NotificationRole) =>
    [...notificationKeys.role(scope, role), 'unread'] as const,
  preferences: (scope: AccountScope) =>
    [...notificationKeys.root(scope), 'preferences'] as const,
};
