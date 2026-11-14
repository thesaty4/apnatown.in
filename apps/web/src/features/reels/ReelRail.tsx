'use client';

import { useId, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { formatCompactCount, type VideoFeedItem } from '@apnatown/shared';
import { NavIcon, type NavIconName } from '../../shared/ui/NavIcon';
import { ShareSheet, useVideoLikeAction } from '../engagement';
import type { ReelGate } from './ReelGateSheet';
import { ReelShopSheet } from './ReelLinks';
import { reelCountClassName, reelRailButtonClassName } from './reel-styles';
import { useReelSave } from './use-reel-save';

function RailAction({
  icon,
  label,
  count,
  countLabel,
  pressed,
  busy = false,
  disabled = false,
  onClick,
}: {
  icon: NavIconName;
  label: string;
  count?: string | undefined;
  countLabel?: string | undefined;
  pressed?: boolean | undefined;
  busy?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const countId = useId();
  return (
    <div className="grid justify-items-center">
      <button
        type="button"
        className={`${reelRailButtonClassName} pointer-events-auto`}
        aria-label={label}
        aria-pressed={pressed}
        aria-busy={busy || undefined}
        aria-disabled={disabled || undefined}
        aria-describedby={count === undefined ? undefined : countId}
        onClick={() => {
          // Stay focusable while busy so keyboard users keep their place.
          if (!disabled && !busy) onClick();
        }}
      >
        <NavIcon name={icon} filled={pressed === true} className="size-6.5" />
      </button>
      {count !== undefined && (
        <p id={countId} className={reelCountClassName}>
          <span aria-hidden="true">{count}</span>
          <span className="sr-only">{countLabel}</span>
        </p>
      )}
    </div>
  );
}

/** Prototype `.rrail`: like, comments, share and overflow for one reel. */
export function ReelRail({
  item,
  onGate,
  onComments,
  onMore,
}: {
  item: VideoFeedItem;
  onGate: (gate: ReelGate) => void;
  onComments: () => void;
  onMore: () => void;
}) {
  const t = useTranslations('reels.feed');
  const likes = useTranslations('engagement.likes');
  const comments = useTranslations('engagement.comments');
  const share = useTranslations('engagement.share');
  const heart = useTranslations('engagement.heart');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const like = useVideoLikeAction(item.id, item.businessId);
  const save = useReelSave(item, onGate);
  const likeCount = like.available ? like.count : item.likeCount;
  const compact = (count: number) => formatCompactCount(count, locale);

  function onLike() {
    if (like.access === 'guest' || like.access === 'unavailable')
      onGate({ kind: 'login', message: likes('loginPrompt') });
    else if (like.access === 'forbidden')
      onGate({
        kind: 'restricted',
        title: likes('restrictedTitle'),
        message: likes('restrictedMessage'),
      });
    else if (like.query.isError) void like.query.refetch();
    else if (like.available) like.toggle();
  }

  let alert: ReactNode = null;
  if (like.errorKey) alert = likes(like.errorKey);
  else if (save.errorKey) alert = heart(save.errorKey);
  else if (like.query.isError && like.access === 'customer')
    alert = t('engagementUnavailable');

  return (
    <>
      <div className="pointer-events-none absolute end-2 bottom-reel-rail-bottom z-2 grid justify-items-center gap-3.5">
        <RailAction
          icon="heart"
          label={likes('like')}
          pressed={like.liked}
          busy={
            like.access === 'pending' ||
            (like.access === 'customer' && like.query.isPending) ||
            like.busy
          }
          disabled={
            like.access === 'customer' &&
            like.query.isSuccess &&
            !like.available
          }
          count={compact(likeCount)}
          countLabel={likes('count', { count: likeCount })}
          onClick={onLike}
        />
        <RailAction
          icon="chat"
          label={comments('title')}
          count={compact(item.commentCount)}
          countLabel={t('commentsCount', { count: item.commentCount })}
          onClick={onComments}
        />
        <ShareSheet
          videoId={item.id}
          renderTrigger={(open) => (
            <RailAction
              icon="share"
              label={share('open')}
              count={compact(item.shareCount)}
              countLabel={t('sharesCount', { count: item.shareCount })}
              onClick={open}
            />
          )}
        />
        {!save.hidden && (
          <RailAction
            icon="bookmark"
            label={heart(save.saved ? 'saved' : 'save')}
            pressed={save.saved}
            busy={save.busy}
            onClick={save.toggle}
          />
        )}
        <ReelShopSheet
          item={item}
          renderTrigger={(open) => (
            <RailAction icon="cart" label={t('shopVideo')} onClick={open} />
          )}
        />
        <RailAction icon="dots" label={t('moreOptions')} onClick={onMore} />
      </div>
      {alert && (
        <p
          role="alert"
          className="absolute inset-x-3 top-3 z-3 m-0 rounded-md bg-reel-canvas/72 px-3 py-2 text-small text-reel-text [overflow-wrap:anywhere]"
        >
          {alert}
        </p>
      )}
    </>
  );
}
