'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { VideoFeedItem } from '@apnatown/shared';
import { StatusBadge } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { useVideoComments, useVideoLikeAction } from '../engagement';
import { reelBusinessName } from './ReelInfo';

function SideComments({
  item,
  onComments,
}: {
  item: VideoFeedItem;
  onComments: () => void;
}) {
  const t = useTranslations('engagement.comments');
  const { query } = useVideoComments(item.id);
  const comments = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <section
      aria-labelledby={`reel-side-comments-${item.id}`}
      className="grid gap-2"
    >
      <h3 id={`reel-side-comments-${item.id}`} className="m-0 text-h4">
        {t('title')}
      </h3>
      {query.isPending ? (
        <p role="status" className="m-0 text-small text-reel-text-2">
          {t('loading')}
        </p>
      ) : query.isError ? (
        <div className="grid justify-items-start gap-2">
          <p role="alert" className="m-0 text-small text-reel-text-2">
            {t('loadFailed')}
          </p>
          <Button
            size="small"
            variant="ghost"
            onClick={() => void query.refetch()}
          >
            {t('retry')}
          </Button>
        </div>
      ) : comments.length === 0 ? (
        <p className="m-0 text-small text-reel-text-2">{t('emptyTitle')}</p>
      ) : (
        <ul className="m-0 grid list-none gap-2 p-0">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="text-small [overflow-wrap:anywhere]"
            >
              <b>{comment.authorLabel}</b>{' '}
              <span className="whitespace-pre-wrap text-reel-text-2">
                {comment.text}
              </span>
              {comment.status === 'pending' && (
                <StatusBadge
                  tone="ap-pending"
                  icon="⏳"
                  label={t('status.pending')}
                  className="ms-1 align-middle"
                />
              )}
            </li>
          ))}
        </ul>
      )}
      {query.hasNextPage && (
        <Button
          size="small"
          variant="text"
          className="justify-self-start text-reel-text"
          loading={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {t('more')}
        </Button>
      )}
      <Button
        size="small"
        variant="ghost"
        className="justify-self-start"
        onClick={onComments}
      >
        {t('addLabel')}
      </Button>
    </section>
  );
}

/** Prototype `.rside` (≥900px): details and comments for the active reel. */
export function ReelSidePanel({
  item,
  onComments,
}: {
  item: VideoFeedItem | undefined;
  onComments: (item: VideoFeedItem) => void;
}) {
  const t = useTranslations('reels.feed');
  return (
    <aside
      aria-label={t('sidePanelLabel')}
      className="my-3 hidden w-reel-side shrink-0 overflow-y-auto rounded-reel-frame bg-reel-panel p-3.5 text-reel-text desktop:block"
    >
      {item && (
        <ActiveDetails
          key={item.id}
          item={item}
          onComments={() => onComments(item)}
        />
      )}
    </aside>
  );
}

function ActiveDetails({
  item,
  onComments,
}: {
  item: VideoFeedItem;
  onComments: () => void;
}) {
  const t = useTranslations('reels.feed');
  const likes = useTranslations('engagement.likes');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const like = useVideoLikeAction(item.id, item.businessId);
  const likeCount = like.available ? like.count : item.likeCount;
  return (
    <div className="grid gap-3.5">
      <div className="grid gap-1">
        <h2 className="m-0 text-h3 [overflow-wrap:anywhere]">
          {reelBusinessName(item, locale) ?? t('businessUnavailable')}
        </h2>
        <p className="m-0 text-small text-reel-text-2">
          {t('views', { count: item.viewCount })} ·{' '}
          {likes('count', { count: likeCount })}
        </p>
        {item.caption && (
          <p className="m-0 whitespace-pre-wrap text-small [overflow-wrap:anywhere]">
            {item.caption}
          </p>
        )}
      </div>
      <SideComments item={item} onComments={onComments} />
    </div>
  );
}
