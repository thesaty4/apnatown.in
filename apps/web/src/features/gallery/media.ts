import type {
  BusinessGalleryFilter,
  GalleryItem,
  MediaLinkTarget,
  MediaPublicImage,
} from '@apnatown/shared';
import { BusinessGalleryFilterSchema } from '@apnatown/shared';
import { formatCompactCount } from '@apnatown/shared/formatters';
import type { Locale } from '../../shared/i18n/preferences';
import { publicHref } from '../../shared/i18n/preferences';

export const GALLERY_FILTERS = BusinessGalleryFilterSchema.options;
/** Gallery filter URL param on `/shop|provider/:slug?tab=gallery`. */
export const GALLERY_FILTER_PARAM = 'filter';

export function readGalleryFilter(value: string | null): BusinessGalleryFilter {
  const parsed = BusinessGalleryFilterSchema.safeParse(value);
  return parsed.success ? parsed.data : 'all';
}

/**
 * Responsive sources only from the DTO's authorized gateway variants (never a
 * constructed storage/provider URL). `src` is the smallest variant that is at
 * least `minWidth` wide, else the largest.
 */
export function imageSources(image: MediaPublicImage, minWidth = 480) {
  const variants = [...image.variants].sort((a, b) => a.width - b.width);
  const src =
    variants.find((variant) => variant.width >= minWidth) ?? variants.at(-1);
  return {
    src: src?.path ?? '',
    srcSet: variants.map((variant) => `${variant.path} ${variant.width}w`).join(', '),
  };
}

/** Canonical item identity for React keys (photo placements are distinct). */
export const galleryItemKey = (item: GalleryItem) =>
  item.kind === 'photo'
    ? `photo:${item.placementType}:${item.placementId}:${item.assetId}`
    : `video:${item.videoId}`;

/** The item a photo belongs to: explicit link, else its listing placement. */
export function photoTarget(
  item: Extract<GalleryItem, { kind: 'photo' }>,
): MediaLinkTarget | null {
  if (item.linkedTarget) return item.linkedTarget;
  if (item.placementType === 'product_image')
    return { targetType: 'product', targetId: item.placementId };
  if (item.placementType === 'service_image')
    return { targetType: 'service', targetId: item.placementId };
  return null;
}

/** Public Reels deep link, optionally returning to a product/service. */
export function videoHref(
  videoId: string,
  locale: Locale,
  from?: MediaLinkTarget,
) {
  const path = publicHref(`/videos/${videoId}`, locale);
  return from
    ? `${path}?${new URLSearchParams({ from: `${from.targetType}:${from.targetId}` }).toString()}`
    : path;
}

/** Indian-grouped compact count (1.2K / 1.5L) via the shared formatter. */
export const compactViews = (count: number, locale: Locale) =>
  formatCompactCount(count, locale);
