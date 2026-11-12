'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';
import { Button } from '@apnatown/ui/primitives/Button';
import { EmptyState, NoPermissionState } from '@apnatown/ui/feedback/StateViews';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { failureCode } from '../../shared/api/result';
import { AccessState, Failure } from '../../shared/auth/AccessState';
import { useBusinessFollowAction } from './engagement-actions';

export function FollowButton({
  videoId,
  businessId,
}: {
  videoId: string;
  businessId: string;
}) {
  const t = useTranslations('engagement.follow');
  const follow = useBusinessFollowAction(videoId, businessId);
  const { query, business } = follow;
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [confirmUnfollow, setConfirmUnfollow] = useState(false);

  if (follow.access === 'pending') return <Skeleton label={t('loading')} />;
  if (follow.access === 'unavailable') return <AccessState guest />;
  if (query.isPending) return <Skeleton label={t('loading')} />;
  if (query.isError)
    return (
      <Failure
        code={failureCode(query.error)}
        retry={() => void query.refetch()}
        retryDisabled={query.isFetching}
      />
    );

  if (!business)
    return (
      <EmptyState
        title={t('unavailableTitle')}
        message={t('unavailableMessage')}
        action={null}
      />
    );

  const canFollow = follow.access === 'customer';
  const forbidden = follow.access === 'forbidden';
  const setFollow = follow.set;

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant={business.following ? 'outline' : 'primary'}
          aria-pressed={business.following}
          loading={follow.busy}
          disabled={forbidden}
          onClick={() => {
            if (!canFollow) setLoginPrompt(true);
            else if (business.following) setConfirmUnfollow(true);
            else setFollow(true, false);
          }}
        >
          {t(business.following ? 'following' : 'follow')}
        </Button>
        {business.following && (
          <Button
            variant="outline"
            aria-pressed={business.bellOn}
            aria-label={t(business.bellOn ? 'bellOn' : 'bellOff')}
            loading={follow.busy}
            disabled={forbidden}
            onClick={() => setFollow(true, !business.bellOn)}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-5 shrink-0"
              fill={business.bellOn ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
            </svg>
            {t(business.bellOn ? 'bellOn' : 'bellOff')}
          </Button>
        )}
      </div>
      {loginPrompt && !canFollow && !forbidden && (
        <AccessState guest guestMessage={t('loginPrompt')} />
      )}
      {forbidden && (
        <NoPermissionState
          title={t('restrictedTitle')}
          message={t('restrictedMessage')}
          action={null}
        />
      )}
      {follow.errorKey && (
        <p role="alert" className="m-0 text-error [overflow-wrap:anywhere]">
          {t(follow.errorKey)}
        </p>
      )}
      <ConfirmDialog
        open={confirmUnfollow}
        title={t('unfollowTitle')}
        impact={t('unfollowImpact')}
        cancelLabel={t('cancel')}
        confirmLabel={t('unfollow')}
        busy={follow.busy}
        onOpenChange={setConfirmUnfollow}
        onConfirm={() => setFollow(false, false, () => setConfirmUnfollow(false))}
      />
    </div>
  );
}
