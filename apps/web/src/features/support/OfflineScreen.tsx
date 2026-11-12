'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@apnatown/ui/primitives/Button';
import { OfflineState } from '@apnatown/ui/feedback/StateViews';

/** S-CUST-36: static offline screen; Try again reloads the page. */
export function OfflineScreen() {
  const t = useTranslations();
  return (
    <OfflineState
      title={t('common.offline.title')}
      message={t('system.offline.message')}
      action={
        <Button onClick={() => window.location.reload()}>
          {t('system.offline.tryAgain')}
        </Button>
      }
    />
  );
}
