'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@apnatown/ui/primitives/Button';

export function RetryListing() {
  const router = useRouter();
  const t = useTranslations('explore.screen');
  return <Button onClick={() => router.refresh()}>{t('retry')}</Button>;
}
