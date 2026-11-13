'use client';

import { HydrationBoundary, type DehydratedState } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { NoPermissionState } from '@apnatown/ui/feedback/StateViews';
import { AccessState } from '../../shared/auth/AccessState';
import { useSession } from '../../shared/auth/SessionProvider';
import { useFeedContext } from './BellBadge';
import { NotificationFeed } from './NotificationFeed';
import type { NotificationRole } from './keys';

/**
 * Notifications page body for one role. Guests/expired sessions get the
 * shared access state; the server decides role authority (403 → no
 * permission), except the customer page which also needs the customer role.
 */
export function NotificationsScreen({
  role,
  initial,
  owner,
  requireRole = false,
  preferencesHref,
}: {
  role: NotificationRole;
  initial: DehydratedState;
  owner?: string | undefined;
  requireRole?: boolean;
  preferencesHref?: string;
}) {
  const t = useTranslations('notifications.feed');
  const { state, epoch } = useSession();
  const context = useFeedContext(role);
  if (state.kind !== 'ready' || !context)
    return <AccessState guest guestMessage={t('guestMessage')} />;
  if (requireRole && !state.data.roles.includes(role))
    return (
      <NoPermissionState
        title={t('forbiddenTitle')}
        message={t('forbiddenMessage')}
        action={null}
      />
    );
  return (
    <HydrationBoundary
      state={owner === state.data.userId && epoch === 0 ? initial : undefined}
    >
      <NotificationFeed
        key={`${state.data.userId}:${epoch}:${role}`}
        context={context}
        {...(preferencesHref && { preferencesHref })}
      />
    </HydrationBoundary>
  );
}
