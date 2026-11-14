import { getTranslations } from 'next-intl/server';
import { PreferencesForm } from '../../../features/users/Preferences';
import { OwnBoundary, ResourceBody } from '../../../features/users/OwnResource';
import { hydrateOwn, readPreferences } from '../../../features/users/server';
import { readSession } from '../../../shared/auth/server';
import { preferencesOptions } from '../../../shared/i18n/preferences-api';

export const dynamic = 'force-dynamic';

export default async function AccountThemePage() {
  const t = await getTranslations('account.theme');
  const session = await readSession();
  const initial = await readPreferences().then((result) =>
    hydrateOwn('preferences', result),
  );
  return (
    <div className="grid gap-4">
      <h1 className="text-h1">{t('title')}</h1>
      <OwnBoundary
        initial={initial}
        owner={session.kind === 'ready' ? session.data.userId : undefined}
        guestMessage={t('guestMessage')}
      >
        {(context) => (
          <ResourceBody
            options={preferencesOptions(
              context.api,
              context.scope,
              context.lifecycle,
            )}
          >
            {(preferences) => (
              <PreferencesForm preferences={preferences} field="theme" />
            )}
          </ResourceBody>
        )}
      </OwnBoundary>
    </div>
  );
}
