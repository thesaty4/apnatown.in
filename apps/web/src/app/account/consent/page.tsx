import { getTranslations } from 'next-intl/server';
import { readConsents, hydrateOwn } from '../../../features/users/server';
import { Consents } from '../../../features/users/Consents';
import { OwnBoundary } from '../../../features/users/OwnResource';
import { readSession } from '../../../shared/auth/server';

export const dynamic = 'force-dynamic';

export default async function AccountConsentPage() {
  const t = await getTranslations('account.consent');
  const session = await readSession();
  const initial = await readConsents().then((result) =>
    hydrateOwn('consents', result),
  );
  return (
    <div className="grid gap-4">
      <h1 className="text-h1">{t('title')}</h1>
      <p className="m-0 text-text-2">{t('intro')}</p>
      <OwnBoundary
        initial={initial}
        owner={session.kind === 'ready' ? session.data.userId : undefined}
        guestMessage={t('guestMessage')}
      >
        {(context) => <Consents {...context} />}
      </OwnBoundary>
    </div>
  );
}
