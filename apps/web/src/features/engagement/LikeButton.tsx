'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@apnatown/ui/primitives/Button';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { EmptyState, NoPermissionState } from '@apnatown/ui/feedback/StateViews';
import { failureCode } from '../../shared/api/result';
import { AccessState, Failure } from '../../shared/auth/AccessState';
import { useVideoLikeAction } from './engagement-actions';

function LikeControl({
  liked,
  count,
  busy,
  disabled,
  onClick,
}: {
  liked: boolean;
  count: number;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const t = useTranslations('engagement.likes');
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant={liked ? 'primary' : 'outline'}
        aria-pressed={liked}
        loading={busy}
        disabled={disabled}
        onClick={onClick}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 10H3v11h4m0-11 5-7h2v7h6l-2 11H7V10Z" />
        </svg>
        {t(liked ? 'liked' : 'like')}
      </Button>
      <span role="status" aria-atomic="true" className="text-small text-text-2">
        {t('count', { count })}
      </span>
    </div>
  );
}

export function LikeButton({
  videoId,
  businessId,
}: {
  videoId: string;
  businessId: string;
}) {
  const t = useTranslations('engagement.likes');
  const like = useVideoLikeAction(videoId, businessId);
  const { query } = like;
  const [loginPrompt, setLoginPrompt] = useState(false);
  if (like.access === 'pending') return <Skeleton label={t('loading')} />;
  if (like.access === 'unavailable') return <AccessState guest />;
  if (query.isPending) return <Skeleton label={t('loading')} />;
  if (query.isError) {
    return <Failure code={failureCode(query.error)} retry={() => void query.refetch()} retryDisabled={query.isFetching} />;
  }
  if (!like.available) {
    return <EmptyState title={t('unavailableTitle')} message={t('unavailableMessage')} action={null} />;
  }
  const canLike = like.access === 'customer';
  const forbidden = like.access === 'forbidden';
  return (
    <div className="grid gap-3">
      <LikeControl
        liked={like.liked}
        count={like.count}
        busy={like.busy}
        disabled={forbidden}
        onClick={() => {
          if (!canLike) setLoginPrompt(true);
          else like.toggle();
        }}
      />
      {loginPrompt && !canLike && !forbidden && <AccessState guest guestMessage={t('loginPrompt')} />}
      {forbidden && (
        <NoPermissionState title={t('restrictedTitle')} message={t('restrictedMessage')} action={null} />
      )}
      {like.errorKey && (
        <p role="alert" className="m-0 text-error [overflow-wrap:anywhere]">
          {t(like.errorKey)}
        </p>
      )}
    </div>
  );
}
