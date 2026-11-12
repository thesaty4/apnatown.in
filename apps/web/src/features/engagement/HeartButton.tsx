'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@apnatown/ui/primitives/Button';
import { EmptyState, NoPermissionState } from '@apnatown/ui/feedback/StateViews';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { failureCode } from '../../shared/api/result';
import { AccessState, Failure } from '../../shared/auth/AccessState';
import { useSession } from '../../shared/auth/SessionProvider';
import { useVideoHeartActions, useVideoLikes } from './likes-queries';

export function HeartButton({
  videoId,
  businessId,
}: {
  videoId: string;
  businessId: string;
}) {
  const t = useTranslations('engagement.heart');
  const { state } = useSession();
  const { query } = useVideoLikes([videoId], [businessId]);
  const heart = useVideoHeartActions(videoId, [businessId]);
  const [loginPrompt, setLoginPrompt] = useState(false);

  if (state.kind === 'loading') return <Skeleton label={t('loading')} />;
  if (state.kind === 'error' && state.code !== 'SESSION_EXPIRED')
    return <AccessState guest />;
  if (query.isPending) return <Skeleton label={t('loading')} />;
  if (query.isError)
    return (
      <Failure
        code={failureCode(query.error)}
        retry={() => void query.refetch()}
        retryDisabled={query.isFetching}
      />
    );

  const available = query.data.videoCounts.some((item) => item.videoId === videoId);
  if (!available)
    return (
      <EmptyState
        title={t('unavailableTitle')}
        message={t('unavailableMessage')}
        action={null}
      />
    );

  const hearted = query.data.heartedTargets.some(
    (target) => target.targetType === 'video' && target.targetId === videoId,
  );
  const canHeart = state.kind === 'ready' && state.data.roles.includes('customer');
  const forbidden = state.kind === 'ready' && !canHeart;
  const error = heart.mutation.isError ? failureCode(heart.mutation.error) : undefined;

  return (
    <div className="grid gap-3">
      <Button
        variant={hearted ? 'primary' : 'outline'}
        aria-pressed={hearted}
        loading={heart.mutation.isPending}
        disabled={forbidden}
        onClick={() => {
          if (!canHeart) setLoginPrompt(true);
          else heart.toggle(!hearted);
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
      {error && (
        <p role="alert" className="m-0 text-error [overflow-wrap:anywhere]">
          {t(error === 'COMMON_RATE_LIMITED' ? 'rateLimited' : 'failed')}
        </p>
      )}
    </div>
  );
}
