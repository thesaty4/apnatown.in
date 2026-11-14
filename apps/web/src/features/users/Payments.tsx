'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Card } from '@apnatown/ui/cards/Card';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { ErrorState } from '@apnatown/ui/feedback/StateViews';
import { Button } from '@apnatown/ui/primitives/Button';
import { useSession } from '../../shared/auth/SessionProvider';
import { publicSettingsOptions } from '../support/api';

/**
 * Account → Payments: the platform's currently configured methods from the
 * public Settings projection. Saved card data is owned by the payment
 * provider/tokenisation layer; this screen never asks for or stores card data.
 */
export function PaymentsScreen() {
  const t = useTranslations('account.payments');
  const { api } = useSession();
  const query = useQuery(publicSettingsOptions(api));

  if (query.isPending) return <Skeleton label={t('title')} />;
  if (query.isError)
    return (
      <ErrorState
        title={t('errorTitle')}
        message={t('errorMessage')}
        action={<Button onClick={() => void query.refetch()}>{t('retry')}</Button>}
      />
    );

  const methods = query.data.paymentMethods;
  return (
    <div className="grid gap-3">
      <p className="m-0 text-text-2">{t('intro')}</p>
      <div className="grid gap-3 tablet:grid-cols-2">
        <Card padded className="flex items-center justify-between gap-3">
          <span className="font-semibold">💳 {t('online')}</span>
          <StatusBadge
            tone={methods.online ? 'ok' : 'neutral'}
            icon={methods.online ? '✓' : '—'}
            label={t(methods.online ? 'available' : 'unavailable')}
          />
        </Card>
        <Card padded className="flex items-center justify-between gap-3">
          <span className="font-semibold">💵 {t('cod')}</span>
          <StatusBadge
            tone={methods.cod ? 'ok' : 'neutral'}
            icon={methods.cod ? '✓' : '—'}
            label={t(methods.cod ? 'available' : 'unavailable')}
          />
        </Card>
      </div>
      <p className="m-0 text-small text-muted">{t('note')}</p>
    </div>
  );
}
