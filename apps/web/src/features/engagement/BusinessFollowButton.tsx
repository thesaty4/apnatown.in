'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@apnatown/ui/primitives/Button';
import type { ButtonVariant } from '@apnatown/ui/primitives/Button';
import { failureCode } from '../../shared/api/result';
import { useBusinessFollow } from './likes-queries';
import { useCustomerAccess } from './engagement-actions';
import { CompactLoginPrompt } from './CompactLoginPrompt';

/** Profile-level follow/unfollow + bell (S-CUST-06/07 action bar). */
export function BusinessFollowButton({
  businessId,
  variant = 'primary',
}: {
  businessId: string;
  variant?: ButtonVariant;
}) {
  const t = useTranslations('engagement.follow');
  const access = useCustomerAccess();
  const { query, mutation, business } = useBusinessFollow(businessId);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const customer = access === 'customer';
  const forbidden = access === 'forbidden';
  const following = business?.following ?? false;
  const errorKey =
    mutation.isError
      ? failureCode(mutation.error) === 'COMMON_RATE_LIMITED'
        ? 'rateLimited'
        : 'failed'
      : query.isError
        ? 'failed'
        : undefined;
  const run = (next: boolean, bellOn: boolean) =>
    void mutation.run({ following: next, bellOn });
  return (
    <div className="grid gap-2">
      <div role="group" aria-label={t('follow')} className="flex flex-wrap gap-2">
        <Button
          variant={following ? 'outline' : variant}
          aria-pressed={following}
          loading={mutation.isPending || query.isPending || access === 'pending'}
          disabled={forbidden || access === 'pending'}
          onClick={() => {
            if (!customer) setLoginPrompt(true);
            else run(!following, following ? false : Boolean(business?.bellOn));
          }}
        >
          {t(following ? 'following' : 'follow')}
        </Button>
        {following && (
          <Button
            variant="outline"
            aria-pressed={business?.bellOn ?? false}
            aria-label={t(business?.bellOn ? 'bellOn' : 'bellOff')}
            loading={mutation.isPending || access === 'pending'}
            disabled={forbidden || access === 'pending'}
            onClick={() => {
              if (!customer) setLoginPrompt(true);
              else run(true, !business?.bellOn);
            }}
          >
            {t(business?.bellOn ? 'bellOn' : 'bellOff')}
          </Button>
        )}
      </div>
      {loginPrompt && !customer && !forbidden && (
        <CompactLoginPrompt message={t('profileLoginPrompt')} />
      )}
      {forbidden && (
        <p className="m-0 text-small text-text-2">{t('restrictedMessage')}</p>
      )}
      {errorKey && (
        <p role="alert" className="m-0 text-small text-error">
          {t(errorKey)}
          {query.isError && (
            <button
              type="button"
              className="ms-2 font-semibold text-primary underline"
              onClick={() => void query.refetch()}
            >
              {t('retry')}
            </button>
          )}
        </p>
      )}
    </div>
  );
}
