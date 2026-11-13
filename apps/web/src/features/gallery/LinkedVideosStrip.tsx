'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Button } from '@apnatown/ui/primitives/Button';
import { useSession } from '../../shared/auth/SessionProvider';
import { MediaSkeleton } from './MediaStates';
import { linkedVideosOptions } from './api';
import { VideoTile } from './VideoTile';

/**
 * PD5/SV4 "Videos & Reels" strip on product/service detail. Hidden when the
 * item has no linked playable videos; a failed read stays visible with retry
 * (never silently hidden). Tiles carry `?from=product:<id>|service:<id>`.
 */
export function LinkedVideosStrip({
  targetType,
  targetId,
}: {
  targetType: 'product' | 'service';
  targetId: string;
}) {
  const t = useTranslations('gallery.strip');
  const { api } = useSession();
  const query = useInfiniteQuery(linkedVideosOptions(api, targetType, targetId));
  const videos = query.data?.pages.flatMap((page) => page.items) ?? [];
  const headingId = `linked-videos-${targetType}-${targetId}`;

  if (query.isSuccess && videos.length === 0) return null;

  let body;
  if (query.isPending) body = <MediaSkeleton label={t('loading')} layout="strip" />;
  else if (query.isError && !query.data)
    body = (
      <p role="alert" className="m-0 flex flex-wrap items-center gap-3 text-small text-error">
        <span aria-hidden="true">⚠</span>
        <span className="min-w-0 [overflow-wrap:anywhere]">{t('error')}</span>
        <Button
          variant="outline"
          size="small"
          className="min-h-touch"
          loading={query.isFetching}
          onClick={() => void query.refetch()}
        >
          {t('retry')}
        </Button>
      </p>
    );
  else
    body = (
      <ul className="-mx-1 m-0 flex list-none snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain p-1 [scrollbar-width:thin]">
        {videos.map((video) => (
          <li key={video.videoId} className="w-40 shrink-0 snap-start tablet:w-44">
            <VideoTile video={video} layout="strip" from={{ targetType, targetId }} />
          </li>
        ))}
        {(query.hasNextPage || query.isFetchNextPageError) && (
          <li className="flex w-40 shrink-0 snap-start items-center justify-center">
            <Button
              variant="outline"
              size="small"
              className="min-h-touch"
              loading={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              {t(query.isFetchNextPageError ? 'retryMore' : 'more')}
            </Button>
          </li>
        )}
      </ul>
    );

  return (
    <section aria-labelledby={headingId} className="grid min-w-0 gap-2">
      <h2 id={headingId} className="m-0 text-h3 font-semibold">
        {t('title')}
      </h2>
      {body}
    </section>
  );
}
