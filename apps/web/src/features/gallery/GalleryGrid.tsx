'use client';

import { useCallback, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { BusinessGalleryFilter, GalleryItem } from '@apnatown/shared';
import { EmptyState } from '@apnatown/ui/feedback/StateViews';
import { Button } from '@apnatown/ui/primitives/Button';
import { Pill } from '@apnatown/ui/primitives/Pill';
import { useSession } from '../../shared/auth/SessionProvider';
import { VideoReportSheet } from '../reels';
import { businessGalleryOptions } from './api';
import { GalleryViewer } from './GalleryViewer';
import {
  GALLERY_FILTERS,
  GALLERY_FILTER_PARAM,
  galleryItemKey,
  imageSources,
  photoTarget,
  readGalleryFilter,
} from './media';
import { LoadMore, MediaLoadError, MediaSkeleton, OfflineNote } from './MediaStates';
import { PhotoReportSheet } from './PhotoReportSheet';
import { VideoTile } from './VideoTile';

type Photo = Extract<GalleryItem, { kind: 'photo' }>;

const MASONRY_SIZES = '(min-width: 900px) 25vw, (min-width: 600px) 33vw, 50vw';

/**
 * S-CUST-06/07 Gallery tab (PF9): filter chips mirrored in `?filter=`
 * (shareable, Back-friendly), masonry of Media's public gallery projection
 * with keyset "Load more", and a full-screen viewer over the loaded pages.
 * Video tiles open the Reels deep link directly.
 */
export function GalleryGrid({
  slug,
  profilePath,
  businessName,
}: {
  slug: string;
  /** Canonical unprefixed profile path, e.g. `/shop/<slug>`. */
  profilePath: string;
  businessName: string;
}) {
  const t = useTranslations('gallery');
  const pathname = usePathname();
  const params = useSearchParams();
  const filter = readGalleryFilter(params.get(GALLERY_FILTER_PARAM));
  const { api } = useSession();
  const query = useInfiniteQuery(businessGalleryOptions(api, slug, filter));
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];

  // The open item is bound to the filter it was opened under, so a Back/
  // Forward filter change closes the viewer instead of showing a stale slide.
  const [opened, setOpened] = useState<{ key: string; filter: string } | null>(null);
  const openKey = opened?.filter === filter ? opened.key : null;
  const setOpenKey = (key: string | null) =>
    setOpened(key === null ? null : { key, filter });
  const [reportKey, setReportKey] = useState<string | null>(null);
  const [reported, setReported] = useState<ReadonlySet<string>>(new Set());
  const current = openKey ? items.findIndex((item) => galleryItemKey(item) === openKey) : -1;
  const reporting = reportKey
    ? items.find((item) => galleryItemKey(item) === reportKey)
    : undefined;

  const selectFilter = useCallback(
    (next: BusinessGalleryFilter) => {
      const search = new URLSearchParams(window.location.search);
      if (next === 'all') search.delete(GALLERY_FILTER_PARAM);
      else search.set(GALLERY_FILTER_PARAM, next);
      const value = search.toString();
      // Shallow entry like the profile tabs: no RSC refetch; Back restores.
      window.history.pushState(null, '', `${pathname}${value ? `?${value}` : ''}`);
      setOpened(null);
    },
    [pathname],
  );

  const loadMoreInViewer = () => {
    if (!query.hasNextPage || query.isFetchingNextPage) return;
    const known = items.length;
    void query.fetchNextPage().then((result) => {
      const next = result.data?.pages.flatMap((page) => page.items)[known];
      if (next) setOpenKey(galleryItemKey(next));
    });
  };

  const markReported = (key: string) =>
    setReported((previous) => new Set(previous).add(key));

  const chips = (
    <div className="sticky top-[calc(var(--spacing-sat)+var(--spacing-nav-h))] z-10 -mx-1 bg-bg px-1 py-2">
      <ul
        aria-label={t('filters.label')}
        className="m-0 flex list-none gap-2 overflow-x-auto overscroll-x-contain p-0 py-1 [scrollbar-width:thin]"
      >
        {GALLERY_FILTERS.map((value) => (
          <li key={value} className="max-w-[80vw] shrink-0">
            <Pill
              label={t(`filters.${value}`)}
              selected={filter === value}
              onClick={() => selectFilter(value)}
            />
          </li>
        ))}
      </ul>
    </div>
  );

  let body;
  if (query.isPending) body = <MediaSkeleton label={t('states.loading')} layout="masonry" />;
  else if (query.isError && !query.data)
    body = (
      <MediaLoadError
        error={query.error}
        retrying={query.isFetching}
        onRetry={() => void query.refetch()}
      />
    );
  else if (items.length === 0)
    body = (
      <EmptyState
        headingLevel="h2"
        icon={filter === 'videos' ? '🎬' : '🖼️'}
        title={t(`empty.${filter}Title`)}
        message={t(`empty.${filter}Message`)}
        action={
          filter === 'all' ? null : (
            <Button variant="outline" onClick={() => selectFilter('all')}>
              {t('empty.showAll')}
            </Button>
          )
        }
      />
    );
  else
    body = (
      <div className="grid gap-stack-gap">
        <OfflineNote />
        <p role="status" className="sr-only">
          {t('states.showing', { count: items.length })}
        </p>
        <ul className="m-0 list-none columns-2 gap-3 p-0 tablet:columns-3 desktop:columns-4">
          {items.map((item, index) => {
            const key = galleryItemKey(item);
            return (
              <li key={key} className="mb-3 break-inside-avoid">
                {item.kind === 'video' ? (
                  <VideoTile video={item} layout="masonry" />
                ) : (
                  <PhotoTile
                    photo={item}
                    label={item.caption?.trim() || t('viewer.photoAlt', { name: businessName, number: index + 1 })}
                    eager={index < 4}
                    onOpen={() => setOpenKey(key)}
                  />
                )}
              </li>
            );
          })}
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
    <section aria-labelledby="profile-gallery-title" className="grid min-w-0 gap-3">
      <h2 id="profile-gallery-title" className="sr-only">{t('grid.title')}</h2>
      {chips}
      {body}
      <GalleryViewer
        slug={slug}
        profilePath={profilePath}
        businessName={businessName}
        items={items}
        current={current}
        open={openKey !== null}
        hasMore={query.hasNextPage}
        loadingMore={query.isFetchingNextPage}
        reported={openKey !== null && reported.has(openKey)}
        onOpenChange={(open) => {
          if (!open) setOpenKey(null);
        }}
        onSelect={(index) => {
          const next = items[index];
          if (next) setOpenKey(galleryItemKey(next));
        }}
        onLoadMore={loadMoreInViewer}
        onReport={(item) => setReportKey(galleryItemKey(item))}
      />
      {reporting?.kind === 'photo' && (
        <PhotoReportSheet
          key={reportKey}
          photo={reporting}
          open
          onOpenChange={(open) => {
            if (!open) setReportKey(null);
          }}
          onReported={() => markReported(galleryItemKey(reporting))}
        />
      )}
      {reporting?.kind === 'video' && (
        <VideoReportSheet
          key={reportKey}
          videoId={reporting.videoId}
          open
          onOpenChange={(open) => {
            if (!open) setReportKey(null);
          }}
          onReported={() => markReported(galleryItemKey(reporting))}
        />
      )}
    </section>
  );
}

function PhotoTile({
  photo,
  label,
  eager,
  onOpen,
}: {
  photo: Photo;
  label: string;
  eager: boolean;
  onOpen: () => void;
}) {
  const t = useTranslations('gallery');
  const source = imageSources(photo.image, 480);
  const target = photoTarget(photo);
  const caption = photo.caption?.trim();
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group grid w-full min-w-0 overflow-hidden rounded-md border border-border bg-surface p-0 text-start text-text shadow-1 transition-shadow duration-2 ease-standard hover:shadow-2 focus-visible:ring-focus motion-reduce:transition-none"
    >
      <span className="sr-only">{t('viewer.open', { label })}</span>
      <span className="block overflow-hidden bg-surface-2">
        <img
          src={source.src}
          srcSet={source.srcSet}
          sizes={MASONRY_SIZES}
          alt=""
          width={photo.image.width}
          height={photo.image.height}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="block h-auto w-full transition-transform duration-3 ease-standard group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      </span>
      {(caption || target) && (
        <span aria-hidden="true" className="grid gap-1 px-2 py-1.5">
          {caption && (
            <span className="line-clamp-2 text-caption [overflow-wrap:anywhere]">{caption}</span>
          )}
          {target && (
            <span className="inline-flex max-w-full items-center gap-1 justify-self-start rounded-pill bg-info-soft px-2 py-0.5 text-caption font-semibold text-text">
              <span className="shrink-0">{target.targetType === 'product' ? '🛍️' : '🔧'}</span>
              <span className="min-w-0 [overflow-wrap:anywhere]">
                {t(target.targetType === 'product' ? 'viewer.linkedProduct' : 'viewer.linkedService')}
              </span>
            </span>
          )}
        </span>
      )}
    </button>
  );
}
