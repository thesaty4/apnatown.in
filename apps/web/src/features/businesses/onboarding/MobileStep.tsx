'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@apnatown/ui/cards/Card';
import { Button } from '@apnatown/ui/primitives/Button';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { maskPhone } from '../parts';
import { useOwnerPhone } from '../queries';

/** Step 1: the session's OTP-verified mobile (no second OTP flow). */
export function MobileStep() {
  const t = useTranslations('business.onboarding');
  const phone = useOwnerPhone();
  return (
    <Card padded className="grid gap-2">
      {phone.isPending ? (
        <Skeleton label={t('mobileLoading')} />
      ) : phone.data?.phone ? (
        <>
          <p className="m-0 text-field-label font-semibold">{t('mobile')}</p>
          <p className="m-0 flex flex-wrap items-center gap-2">
            <bdi className="font-semibold tabular-nums">
              {maskPhone(phone.data.phone)}
            </bdi>
            <span className="inline-flex items-center gap-1 text-small font-semibold text-success">
              <span aria-hidden="true">✓</span> {t('mobileVerified')}
            </span>
          </p>
          <p className="m-0 text-small text-text-2">{t('mobileHint')}</p>
        </>
      ) : (
        <div className="grid gap-2" role="alert">
          <p className="m-0 text-small">{t('mobileUnavailable')}</p>
          <Button
            size="small"
            variant="outline"
            className="justify-self-start"
            disabled={phone.isFetching}
            onClick={() => void phone.refetch()}
          >
            {t('retry')}
          </Button>
        </div>
      )}
    </Card>
  );
}
