'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { EmptyState } from '@apnatown/ui/feedback/StateViews';
import { buttonClassName } from '@apnatown/ui/primitives/Button';
import { publicHref } from '../../shared/i18n/preferences';
import { consumeDeletionProof, hasDeletionProof } from './deletion-proof';

/** S-CUST-29. Claims deletion only with this client session's one-shot proof;
 * a reload or direct visit gets a neutral page. Renders no account data. */
export function Goodbye() {
  const t = useTranslations('privacy.goodbye');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const [confirmed] = useState(hasDeletionProof);
  useEffect(() => consumeDeletionProof(), []);
  const home = (
    <Link className={buttonClassName} href={publicHref('/', locale)}>
      {t('home')}
    </Link>
  );
  return confirmed ? (
    <EmptyState
      icon="👋"
      title={t('title')}
      message={t('message')}
      action={home}
    />
  ) : (
    <EmptyState
      icon="🏠"
      title={t('neutralTitle')}
      message={t('neutralMessage')}
      action={home}
    />
  );
}
