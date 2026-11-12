'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  Button,
  buttonVariantClassName,
} from '@apnatown/ui/primitives/Button';
import {
  EmptyState,
  NoPermissionState,
  OfflineState,
} from '@apnatown/ui/feedback/StateViews';
import { Failure } from '../../shared/auth/AccessState';
import { loginHref } from '../../shared/auth/return-to';
import { publicHref } from '../../shared/i18n/preferences';

const stateClassName = 'min-h-full content-center text-reel-text';

/** Dark skeleton slide in the shape of a reel (rail + owner row). */
export function ReelLoadingSlide() {
  const t = useTranslations('reels.feed');
  return (
    <div
      role="status"
      className="relative grid h-full place-items-center bg-reel-surface"
    >
      <span className="sr-only">{t('loading')}</span>
      <span
        aria-hidden="true"
        className="size-10 animate-spinner rounded-pill border-4 border-reel-text/25 border-t-reel-text motion-reduce:animate-none"
      />
      <div
        aria-hidden="true"
        className="absolute end-2 bottom-reel-rail-bottom grid gap-3.5"
      >
        {[0, 1, 2, 3].map((key) => (
          <span key={key} className="size-touch rounded-pill bg-reel-text/10" />
        ))}
      </div>
      <div
        aria-hidden="true"
        className="absolute start-3 end-reel-info-end bottom-4 grid gap-2"
      >
        <div className="flex items-center gap-2">
          <span className="size-reel-compact rounded-pill bg-reel-text/10" />
          <span className="h-4 w-1/2 rounded-sm bg-reel-text/10" />
        </div>
        <span className="h-3 w-4/5 rounded-sm bg-reel-text/10" />
      </div>
    </div>
  );
}

export type ReelFeedProblem =
  | { kind: 'nearbyNeedsLocation' }
  | { kind: 'expired' }
  | { kind: 'unpublished' }
  | { kind: 'forbidden' }
  | { kind: 'failed'; code: string; retrying: boolean }
  | { kind: 'empty'; pill: string; signedIn: boolean }
  | { kind: 'offline' };

/** Prototype `.rstate` views on the always-dark Reels surface. */
export function ReelFeedStatus({
  problem,
  onRetry,
  onRestart,
  onBrowse,
  onForYou,
}: {
  problem: ReelFeedProblem;
  onRetry: () => void;
  onRestart: () => void;
  onBrowse: () => void;
  onForYou: () => void;
}) {
  const t = useTranslations('reels.feed');
  const copy = useTranslations('common.copy');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const shared = {
    tone: 'immersive',
    headingLevel: 'h2',
    className: stateClassName,
  } as const;
  const forYou = (
    <Button variant="inverse" onClick={onForYou}>
      {t('tryForYou')}
    </Button>
  );

  switch (problem.kind) {
    case 'nearbyNeedsLocation':
      return (
        <EmptyState
          {...shared}
          icon="📍"
          title={t('emptyNearbyTitle')}
          message={t('nearbyRequiresLocation')}
          action={forYou}
        />
      );
    case 'expired':
      return (
        <EmptyState
          {...shared}
          icon="⏱️"
          title={t('feedExpiredTitle')}
          message={t('feedExpired')}
          action={
            <Button variant="inverse" onClick={onRestart}>
              {t('startFresh')}
            </Button>
          }
        />
      );
    case 'unpublished':
      return (
        <EmptyState
          {...shared}
          icon="🚫"
          title={t('videoUnavailableTitle')}
          message={t('videoUnavailableMessage')}
          action={
            <Button variant="inverse" onClick={onBrowse}>
              {t('browseVideos')}
            </Button>
          }
        />
      );
    case 'forbidden':
      return (
        <NoPermissionState
          {...shared}
          title={t('title')}
          message={t('emptyMessage')}
          action={
            <Button variant="inverse" onClick={onRetry}>
              {t('retry')}
            </Button>
          }
        />
      );
    case 'failed':
      return (
        <div className={`grid ${stateClassName}`}>
          <Failure
            code={problem.code}
            retry={onRetry}
            retryDisabled={problem.retrying}
            tone="immersive"
            headingLevel="h2"
          />
        </div>
      );
    case 'offline':
      return (
        <OfflineState
          {...shared}
          role="alert"
          title={copy('youAreOffline')}
          message={t('offlineMessage')}
          action={
            <Button variant="inverse" onClick={onRetry}>
              {copy('retry')}
            </Button>
          }
        />
      );
    case 'empty': {
      const following = problem.pill === 'following';
      const nearby = problem.pill === 'nearby';
      return (
        <EmptyState
          {...shared}
          icon={following ? '🔔' : nearby ? '📍' : '📭'}
          title={t(
            following
              ? 'emptyFollowingTitle'
              : nearby
                ? 'emptyNearbyTitle'
                : 'emptyTitle',
          )}
          message={t(
            following
              ? 'emptyFollowingMessage'
              : nearby
                ? 'emptyNearbyMessage'
                : 'emptyMessage',
          )}
          action={
            following && !problem.signedIn ? (
              <Link
                className={buttonVariantClassName('inverse')}
                href={loginHref(
                  locale,
                  `${publicHref('/videos', locale)}?pill=following`,
                )}
              >
                {t('signIn')}
              </Link>
            ) : following || nearby ? (
              forYou
            ) : null
          }
        />
      );
    }
  }
}
