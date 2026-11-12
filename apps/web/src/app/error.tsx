'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@apnatown/ui/primitives/Button';
import { ErrorState } from '@apnatown/ui/feedback/StateViews';

/** S-CUST-35: route failure with Retry and a support reference. */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');
  return (
    <ErrorState
      title={t('error.snag')}
      message={t('error.message')}
      action={
        <div className="grid justify-items-center gap-2">
          <Button onClick={() => reset()}>{t('actions.retry')}</Button>
          {error.digest && (
            <p className="text-caption text-muted [overflow-wrap:anywhere]">
              {t('error.reference', { id: error.digest })}
            </p>
          )}
        </div>
      }
    />
  );
}
