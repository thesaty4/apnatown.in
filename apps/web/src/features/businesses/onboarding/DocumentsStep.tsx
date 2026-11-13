'use client';

import { useTranslations } from 'next-intl';
import type { BusinessKind } from '@apnatown/shared/businesses';
import { Alert } from '../parts';

/** Step 6: private document storage is not available (Q-40). */
export function DocumentsStep({ kind }: { kind: BusinessKind }) {
  const t = useTranslations('business.onboarding');
  const items =
    kind === 'shop'
      ? (['docId', 'docShopPhoto', 'docLicence'] as const)
      : (['docId', 'docWorkPhoto', 'docLicence'] as const);
  return (
    <div className="grid gap-3">
      <Alert tone="info" role="note" title={t('documentsUnavailableTitle')}>
        <p className="m-0">{t('documentsUnavailable')}</p>
      </Alert>
      <ul className="m-0 grid list-none gap-2 p-0">
        {items.map((item) => (
          <li
            key={item}
            aria-disabled="true"
            className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface-2 p-3 text-small text-muted"
          >
            <span className="min-w-0 flex-1">{t(item)}</span>
            <span className="text-caption font-semibold">
              {t('documentsSoon')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
