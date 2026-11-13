'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@apnatown/ui/primitives/Button';
import { EmptyState, NoPermissionState } from '@apnatown/ui/feedback/StateViews';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { failureCode } from '../../shared/api/result';
import { AccessState, Failure } from '../../shared/auth/AccessState';
import { useVideoSaveAction } from './engagement-actions';

export function HeartButton({
  videoId,
  businessId,
}: {
  videoId: string;
  businessId: string;
}) {
  const t = useTranslations('engagement.heart');
  const save = useVideoSaveAction(videoId, businessId);
  const { query } = save;
  const [loginPrompt, setLoginPrompt] = useState(false);

  if (save.access === 'pending') return <Skeleton label={t('loading')} />;
  if (save.access === 'unavailable') return <AccessState guest />;
  if (query.isPending) return <Skeleton label={t('loading')} />;
  if (query.isError)
    return (
      <Failure
        code={failureCode(query.error)}
        retry={() => void query.refetch()}
        retryDisabled={query.isFetching}
      />
    );

  if (!save.available)
    return (
      <EmptyState
        title={t('unavailableTitle')}
        message={t('unavailableMessage')}
        action={null}
      />
    );

  const hearted = save.saved;
  const canHeart = save.access === 'customer';
  const forbidden = save.access === 'forbidden';

  return (
    <div className="grid gap-3">
      <Button
        variant={hearted ? 'primary' : 'outline'}
        aria-pressed={hearted}
        loading={save.busy}
        disabled={forbidden}
        onClick={() => {
          if (!canHeart) setLoginPrompt(true);
          else save.toggle();
        }}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-5 shrink-0 transition-transform active:scale-110 motion-reduce:transition-none"
          fill={hearted ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
        </svg>
        {t(hearted ? 'saved' : 'save')}
      </Button>
      {loginPrompt && !canHeart && !forbidden && (
        <AccessState guest guestMessage={t('loginPrompt')} />
      )}
      {forbidden && (
        <NoPermissionState
          title={t('restrictedTitle')}
          message={t('restrictedMessage')}
          action={null}
        />
      )}
      {save.errorKey && (
        <p role="alert" className="m-0 text-error [overflow-wrap:anywhere]">
          {t(save.errorKey)}
        </p>
      )}
    </div>
  );
}
