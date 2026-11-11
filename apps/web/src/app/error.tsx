'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@apnatown/ui/primitives/Button';
import { ErrorState } from '@apnatown/ui/feedback/StateViews';

export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');
  return (
    <ErrorState
      title={t('error.title')}
      message={t('error.message')}
      action={<Button onClick={() => reset()}>{t('actions.retry')}</Button>}
    />
  );
}
