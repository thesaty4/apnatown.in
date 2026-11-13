'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@apnatown/ui/feedback/StateViews';
import { useSession } from '../../shared/auth/SessionProvider';
import { businessVideosOptions } from './api';
import { LoadMore, MediaLoadError, MediaSkeleton, OfflineNote } from './MediaStates';
import { VideoTile } from './VideoTile';

/**
 * Profile Videos tab: the business's published, playable videos in owner
 * order. Tiles deep-link to the Reels viewer (`/videos/:id`).
 */
export function VideoGrid({ slug }: { slug: string }) {
  const t = useTranslations('gallery.videosTab');
  const states = useTranslations('gallery.states');
  const { api } = useSession();
  const query = useInfiniteQuery(businessVideosOptions(api, slug));
  const videos = query.data?.pages.flatMap((page) => page.items) ?? [];

  let body;
  if (query.isPending) body = <MediaSkeleton label={states('loading')} layout="grid" />;
  else if (query.isError && !query.data)
    body = (
      <MediaLoadError
        error={query.error}
        retrying={query.isFetching}
        onRetry={() => void query.refetch()}
      />
    );
  else if (videos.length === 0)
    body = (
      <EmptyState
        headingLevel="h2"
        icon="🎬"
        title={t('emptyTitle')}
        message={t('emptyMessage')}
        action={null}
      />
    );
  else
    body = (
      <div className="grid gap-stack-gap">
        <OfflineNote />
        <p role="status" className="sr-only">
          {t('showing', { count: videos.length })}
        </p>
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 tablet:grid-cols-3 desktop:grid-cols-4">
          {videos.map((video) => (
            <li key={video.videoId} className="min-w-0">
              <VideoTile video={video} layout="grid" />
            </li>
          ))}
        </ul>
        <LoadMore
          hasNextPage={query.hasNextPage}
          isFetchingNextPage={query.isFetchingNextPage}
          isFetchNextPageError={query.isFetchNextPageError}
          onLoadMore={() => void query.fetchNextPage()}
        />
      </div>
    );

  return (
    <section aria-labelledby="profile-videos-title" className="grid min-w-0 gap-3">
      <h2 id="profile-videos-title" className="sr-only">{t('title')}</h2>
      {body}
    </section>
  );
}
