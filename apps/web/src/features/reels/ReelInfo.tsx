'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { formatDistanceKm, type VideoFeedItem } from '@apnatown/shared';
import { ConfirmDialog } from '@apnatown/ui/overlay/ConfirmDialog';
import { Button } from '@apnatown/ui/primitives/Button';
import { NavIcon } from '../../shared/ui/NavIcon';
import { useBusinessFollowAction } from '../engagement';
import type { ReelGate } from './ReelGateSheet';
import { reelIconButtonClassName } from './reel-styles';

export function reelBusinessName(item: VideoFeedItem, locale: 'en' | 'hi') {
  return locale === 'hi'
    ? (item.businessNameHi ?? item.businessNameEn)
    : (item.businessNameEn ?? item.businessNameHi);
}

type FollowAction = ReturnType<typeof useBusinessFollowAction>;

/** Prototype `followBtn()`: + Follow / ✓ Following with a bell toggle. */
function ReelFollow({
  follow,
  name,
  onGate,
}: {
  follow: FollowAction;
  name: string;
  onGate: (gate: ReelGate) => void;
}) {
  const t = useTranslations('engagement.follow');
  const [confirmUnfollow, setConfirmUnfollow] = useState(false);
  const { access, query, business } = follow;
  if (access === 'customer' && query.isSuccess && !business) return null;
  const following = business?.following ?? false;
  const loading =
    access === 'pending' || (access === 'customer' && query.isPending);

  function onFollow() {
    if (access === 'guest' || access === 'unavailable')
      onGate({ kind: 'login', message: t('loginPrompt') });
    else if (access === 'forbidden')
      onGate({
        kind: 'restricted',
        title: t('restrictedTitle'),
        message: t('restrictedMessage'),
      });
    else if (query.isError) void query.refetch();
    else if (following) setConfirmUnfollow(true);
    else follow.set(true, false);
  }

  return (
    <>
      <Button
        size="small"
        variant={following ? 'ghost' : 'primary'}
        className="pointer-events-auto shrink-0 whitespace-nowrap"
        aria-pressed={following}
        loading={loading || follow.busy}
        onClick={onFollow}
      >
        <NavIcon name={following ? 'check' : 'plus'} className="size-4" />
        {t(following ? 'following' : 'follow')}
      </Button>
      {following && business && (
        <button
          type="button"
          className={`${reelIconButtonClassName} pointer-events-auto size-reel-compact`}
          aria-pressed={business.bellOn}
          aria-label={t('bellFor', { name })}
          title={t(business.bellOn ? 'bellOn' : 'bellOff')}
          aria-busy={follow.busy || undefined}
          onClick={() => {
            if (!follow.busy) follow.set(true, !business.bellOn);
          }}
        >
          <NavIcon name="bell" filled={business.bellOn} className="size-4.5" />
        </button>
      )}
      <ConfirmDialog
        open={confirmUnfollow}
        title={t('unfollowTitle')}
        impact={t('unfollowImpact')}
        cancelLabel={t('cancel')}
        confirmLabel={t('unfollow')}
        busy={follow.busy}
        onOpenChange={setConfirmUnfollow}
        onConfirm={() =>
          follow.set(false, false, () => setConfirmUnfollow(false))
        }
      />
    </>
  );
}

/** Prototype `.rinfo`: owner row, caption, hashtags, distance and open state. */
export function ReelInfo({
  item,
  onGate,
}: {
  item: VideoFeedItem;
  onGate: (gate: ReelGate) => void;
}) {
  const t = useTranslations('reels.feed');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const followT = useTranslations('engagement.follow');
  const name = reelBusinessName(item, locale) ?? t('businessUnavailable');
  const follow = useBusinessFollowAction(item.id, item.businessId);

  return (
    <div className="pointer-events-none absolute start-3 end-reel-info-end bottom-4 z-2 grid gap-2 text-reel-text">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span
            aria-hidden="true"
            className="grid size-reel-compact shrink-0 place-items-center rounded-pill art-fill font-bold text-reel-surface"
          >
            {name.trim().charAt(0).toLocaleUpperCase(locale)}
          </span>
          <h2 className="m-0 min-w-0 truncate text-body font-bold">{name}</h2>
          {item.verified && (
            <span className="shrink-0 text-reel-verified" title={t('verified')}>
              <NavIcon name="shield" className="size-4" />
              <span className="sr-only">{t('verified')}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ReelFollow follow={follow} name={name} onGate={onGate} />
        </div>
      </div>
      {item.caption && (
        <p className="m-0 line-clamp-3 whitespace-pre-wrap text-small [overflow-wrap:anywhere]">
          {item.caption}
        </p>
      )}
      {item.hashtags.length > 0 && (
        <p className="m-0 text-small text-reel-hashtag [overflow-wrap:anywhere]">
          {item.hashtags.map((tag) => `#${tag}`).join(' ')}
        </p>
      )}
      {(item.distanceKm !== null || item.isOpen !== null) && (
        <div className="flex flex-wrap items-center gap-2 text-caption">
          {item.distanceKm !== null && (
            <span className="inline-flex items-center gap-1">
              <NavIcon name="pin" className="size-3" />
              {t('distance', {
                distance: formatDistanceKm(item.distanceKm, locale),
              })}
            </span>
          )}
          {item.isOpen !== null && (
            <span
              className={`inline-flex items-center gap-1 rounded-pill border border-current bg-reel-canvas/40 px-badge-inline py-badge-block text-caption-min font-semibold ${item.isOpen ? 'text-reel-open' : 'text-reel-closed'}`}
            >
              <span aria-hidden="true">{item.isOpen ? '●' : '○'}</span>
              {t(item.isOpen ? 'open' : 'closed')}
            </span>
          )}
        </div>
      )}
      {follow.errorKey && (
        <p
          role="alert"
          className="m-0 rounded-md bg-reel-canvas/72 px-3 py-2 text-small [overflow-wrap:anywhere]"
        >
          {followT(follow.errorKey)}
        </p>
      )}
    </div>
  );
}
