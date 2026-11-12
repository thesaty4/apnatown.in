'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';
import { Button } from '@apnatown/ui/primitives/Button';
import { EmptyState, NoPermissionState } from '@apnatown/ui/feedback/StateViews';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { failureCode } from '../../shared/api/result';
import { AccessState, Failure } from '../../shared/auth/AccessState';
import { useSession } from '../../shared/auth/SessionProvider';
import { useBusinessFollowActions, useVideoLikes } from './likes-queries';

export function FollowButton({
  videoId,
  businessId,
}: {
  videoId: string;
  businessId: string;
}) {
  const t = useTranslations('engagement.follow');
  const { state } = useSession();
  const { query } = useVideoLikes([videoId], [businessId]);
  const follow = useBusinessFollowActions(videoId, businessId);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [confirmUnfollow, setConfirmUnfollow] = useState(false);

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

  const business = query.data.businessStates.find(
    (item) => item.businessId === businessId,
  );
  if (!business)
    return (
      <EmptyState
        title={t('unavailableTitle')}
        message={t('unavailableMessage')}
        action={null}
      />
    );

  const canFollow = state.kind === 'ready' && state.data.roles.includes('customer');
  const forbidden = state.kind === 'ready' && !canFollow;
  const error = follow.mutation.isError
    ? failureCode(follow.mutation.error)
    : undefined;

  function setFollow(following: boolean, bellOn: boolean, onSuccess?: () => void) {
    void follow.mutation.run({ following, bellOn }, onSuccess);
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant={business.following ? 'outline' : 'primary'}
          aria-pressed={business.following}
          loading={follow.mutation.isPending}
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
            loading={follow.mutation.isPending}
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
      {error && (
        <p role="alert" className="m-0 text-error [overflow-wrap:anywhere]">
          {t(error === 'COMMON_RATE_LIMITED' ? 'rateLimited' : 'failed')}
        </p>
      )}
      <ConfirmDialog
        open={confirmUnfollow}
        title={t('unfollowTitle')}
        impact={t('unfollowImpact')}
        cancelLabel={t('cancel')}
        confirmLabel={t('unfollow')}
        busy={follow.mutation.isPending}
        onOpenChange={setConfirmUnfollow}
        onConfirm={() => setFollow(false, false, () => setConfirmUnfollow(false))}
      />
    </div>
  );
}
