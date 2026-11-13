'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import type { GalleryItem } from '@apnatown/shared';
import { Skeleton } from '@apnatown/ui/feedback/Skeleton';
import { FullScreenViewer } from '@apnatown/ui/overlay/FullScreenViewer';
import { Button, buttonVariantClassName } from '@apnatown/ui/primitives/Button';
import { publicHref } from '../../shared/i18n/preferences';
import { NavIcon } from '../../shared/ui/NavIcon';
import { HeartButton } from '../engagement';
import { imageSources, photoTarget, videoHref } from './media';
import { useLinkedListing } from './queries';
import { ProviderBadge } from './VideoTile';

type Photo = Extract<GalleryItem, { kind: 'photo' }>;

const chipClassName =
  'inline-flex min-h-touch max-w-full items-center gap-2 justify-self-start rounded-pill border-(length:--at-chip-border) ' +
  'border-border-strong bg-surface px-field-inline py-1 text-chip font-medium text-text no-underline ' +
  'transition-colors duration-2 ease-standard hover:bg-surface-2 focus-visible:ring-focus motion-reduce:transition-none';

/** PF9 linked-item chip: resolves the public listing page when known. */
function LinkedChip({
  slug,
  profilePath,
  photo,
}: {
  slug: string;
  profilePath: string;
  photo: Photo;
}) {
  const t = useTranslations('gallery.viewer');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const target = photoTarget(photo);
  const linked = useLinkedListing(slug, target);
  if (!target || linked.status === 'none') return null;
  const icon = target.targetType === 'product' ? '🛍️' : '🔧';
  if (linked.status === 'pending')
    return (
      <Skeleton
        shape="block"
        label={t('linkedLoading')}
        className="h-touch w-48 max-w-full rounded-pill"
      />
    );
  if (linked.status === 'found') {
    const name =
      locale === 'hi' && linked.item.nameHi ? linked.item.nameHi : linked.item.nameEn;
    return (
      <Link href={publicHref(linked.item.path, locale)} className={chipClassName}>
        <span aria-hidden="true" className="shrink-0">{icon}</span>
        <span className="min-w-0 [overflow-wrap:anywhere]">
          <span className="sr-only">
            {t(target.targetType === 'product' ? 'linkedProduct' : 'linkedService')}:{' '}
          </span>
          {name}
        </span>
        <NavIcon name="cr" className="size-4" />
      </Link>
    );
  }
  // Not in the loaded listing page: open the profile's matching segment.
  const query = new URLSearchParams({
    tab: 'listings',
    type: target.targetType === 'product' ? 'products' : 'services',
  });
  return (
    <Link href={`${publicHref(profilePath, locale)}?${query.toString()}`} className={chipClassName}>
      <span aria-hidden="true" className="shrink-0">{icon}</span>
      <span className="min-w-0 [overflow-wrap:anywhere]">
        {t(target.targetType === 'product' ? 'viewLinkedProduct' : 'viewLinkedService')}
      </span>
      <NavIcon name="cr" className="size-4" />
    </Link>
  );
}

/**
 * Gallery lightbox over the loaded pages: photos show the full image; videos
 * show their poster with a Play link to Reels. Report opens the caller's
 * typed photo/video sheet; success is announced here (the page beneath is
 * inert while the viewer is open) and never hides the item.
 */
export function GalleryViewer({
  slug,
  profilePath,
  businessName,
  items,
  current,
  open,
  hasMore,
  loadingMore,
  reported,
  onOpenChange,
  onSelect,
  onLoadMore,
  onReport,
}: {
  slug: string;
  profilePath: string;
  businessName: string;
  items: readonly GalleryItem[];
  /** Index of the open item, or -1 when it disappeared after a refresh. */
  current: number;
  open: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  reported: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (index: number) => void;
  onLoadMore: () => void;
  onReport: (item: GalleryItem) => void;
}) {
  const t = useTranslations('gallery.viewer');
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const item = current >= 0 ? items[current] : undefined;
  const last = items.length - 1;
  const hasNext = item !== undefined && (current < last || hasMore);
  const position = item
    ? t(hasMore ? 'positionMore' : 'position', { current: current + 1, total: items.length })
    : t('unavailableTitle');
  const label = item
    ? item.caption?.trim() || t('photoAlt', { name: businessName, number: current + 1 })
    : '';

  let media;
  if (!item)
    media = (
      <p role="status" className="m-0 grid max-w-state-copy gap-2 px-6 text-center">
        <span aria-hidden="true" className="text-state-icon">🖼️</span>
        <span className="font-semibold">{t('unavailableTitle')}</span>
        <span className="text-reel-text-2">{t('unavailableMessage')}</span>
      </p>
    );
  else if (item.kind === 'photo') {
    const source = imageSources(item.image, 1080);
    media = (
      <img
        key={`${item.assetId}:${item.placementId}`}
        src={source.src}
        srcSet={source.srcSet}
        sizes="100vw"
        alt={label}
        width={item.image.width}
        height={item.image.height}
        decoding="async"
        draggable={false}
        className="block h-auto max-h-full w-auto max-w-full rounded-sm object-contain"
      />
    );
  } else {
    const poster = item.thumbnail ? imageSources(item.thumbnail, 720) : null;
    media = (
      <div className="relative grid max-h-full max-w-full place-items-center">
        {poster ? (
          <img
            key={item.videoId}
            src={poster.src}
            srcSet={poster.srcSet}
            sizes="100vw"
            alt=""
            width={item.thumbnail?.width}
            height={item.thumbnail?.height}
            decoding="async"
            draggable={false}
            className="block h-auto max-h-[60dvh] w-auto max-w-full rounded-sm object-contain"
          />
        ) : (
          <span aria-hidden="true" className="block aspect-[4/5] w-60 max-w-full rounded-sm bg-reel-surface" />
        )}
        <Link
          href={videoHref(item.videoId, locale)}
          className={`${buttonVariantClassName('inverse')} absolute`}
        >
          <NavIcon name="play" className="size-5" filled />
          {t('playVideo')}
        </Link>
      </div>
    );
  }

  return (
    <FullScreenViewer
      open={open}
      onOpenChange={onOpenChange}
      title={t('title')}
      position={position}
      hasPrevious={item !== undefined && current > 0}
      hasNext={hasNext}
      busy={loadingMore}
      onPrevious={() => onSelect(current - 1)}
      onNext={() => (current < last ? onSelect(current + 1) : onLoadMore())}
      onFirst={item ? () => onSelect(0) : undefined}
      onLast={item ? () => onSelect(last) : undefined}
      labels={{ close: t('close'), previous: t('previous'), next: t('next') }}
      media={media}
      details={
        item && (
          <>
            {item.caption?.trim() ? (
              <p className="m-0 font-semibold [overflow-wrap:anywhere]">{item.caption}</p>
            ) : null}
            {item.kind === 'video' && (
              <div className="flex flex-wrap items-center gap-2">
                <ProviderBadge provider={item.provider} />
              </div>
            )}
            {item.kind === 'photo' && (
              <LinkedChip slug={slug} profilePath={profilePath} photo={item} />
            )}
            <div className="flex flex-wrap items-start justify-between gap-3">
              {item.kind === 'video' ? (
                <HeartButton videoId={item.videoId} businessId={item.businessId} />
              ) : (
                <span />
              )}
              <Button variant="text" size="small" onClick={() => onReport(item)}>
                <NavIcon name="flag" className="size-4" />
                {t(item.kind === 'photo' ? 'reportPhoto' : 'reportVideo')}
              </Button>
            </div>
            <p role="status" className="m-0">
              {reported && (
                <span className="flex items-start gap-2 rounded-md bg-success-soft px-3 py-2 text-small text-text">
                  <span aria-hidden="true" className="text-success">✓</span>
                  <span className="min-w-0 [overflow-wrap:anywhere]">{t('reported')}</span>
                </span>
              )}
            </p>
          </>
        )
      }
    />
  );
}
