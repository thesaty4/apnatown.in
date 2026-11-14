import { getTranslations } from 'next-intl/server';
import { OwnBoundary } from '../../../features/users/OwnResource';
import { PaymentsScreen } from '../../../features/users/Payments';
import { readSession } from '../../../shared/auth/server';

export const dynamic = 'force-dynamic';

export default async function AccountPaymentsPage() {
  const t = await getTranslations('account.payments');
  const session = await readSession();
  return (
    <div className="grid gap-4">
      <h1 className="text-h1">{t('title')}</h1>
      <OwnBoundary
        initial={{ mutations: [], queries: [] }}
        owner={session.kind === 'ready' ? session.data.userId : undefined}
        guestMessage={t('intro')}
      >
        {() => <PaymentsScreen />}
      </OwnBoundary>
    </div>
  );
}
