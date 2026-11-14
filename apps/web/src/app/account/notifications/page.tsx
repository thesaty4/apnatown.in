import { getTranslations } from 'next-intl/server';
import { ChannelPreferences } from '../../../features/notifications/ChannelPreferences';
import { readNotificationPreferences } from '../../../features/notifications/server';
import { OwnBoundary } from '../../../features/users/OwnResource';
import { readSession } from '../../../shared/auth/server';

export const dynamic = 'force-dynamic';

export default async function AccountNotificationsPage() {
  const t = await getTranslations('account.notifications');
  const session = await readSession();
  const initial = (await readNotificationPreferences()) ?? {
    mutations: [],
    queries: [],
  };
  return (
    <div className="grid gap-4">
      <h1 className="text-h1">{t('title')}</h1>
      <p className="m-0 text-text-2">{t('intro')}</p>
      <OwnBoundary
        initial={initial}
        owner={session.kind === 'ready' ? session.data.userId : undefined}
        guestMessage={t('guestMessage')}
      >
        {(context) => <ChannelPreferences {...context} />}
      </OwnBoundary>
    </div>
  );
}
