import {
  MediaPublicImageSchema,
  PublicVideoCardSchema,
  SafeVideoPlaybackSchema,
  VideoSchema,
  VideoSourceSchema,
  type MediaPublicImage,
  type MediaPublicQuery,
  type PublicVideoCard,
  type Video,
} from '@apnatown/shared';
import { DomainError } from '../../../shared/errors/errors';
import { StoredVariantSchema, publicImagePath } from '../domain/images';
import type { PublicVideoRecord, StoredPublicImage } from '../domain/media-gallery';
import { videoPlayback } from '../domain/video-source';
import type { StoredVideo } from '../domain/videos';

export interface PublicPlacement {
  placementType: MediaPublicQuery['placementType'];
  placementId: string;
  surface: MediaPublicQuery['surface'];
}

/** Placement-bound gateway variants; storage references never leave the API. */
export function publicImage(stored: StoredPublicImage, placement: PublicPlacement): MediaPublicImage {
  const variants = StoredVariantSchema.array().min(1).max(4).parse(stored.variants);
  return MediaPublicImageSchema.parse({
    assetId: stored.assetId,
    width: stored.width,
    height: stored.height,
    variants: variants
      .map((variant) => ({
        width: variant.width,
        height: variant.height,
        mimeType: 'image/webp',
        bytes: variant.bytes,
        path: publicImagePath(stored.assetId, {
          ...placement,
          variantWidth: variant.width,
          assetVersion: stored.version,
        }),
      }))
      .sort((a, b) => a.width - b.width),
  });
}

/** Default display path: the largest variant up to 1280 px wide. */
export function defaultPath(image: MediaPublicImage): string {
  const fitting = image.variants.filter((variant) => variant.width <= 1280);
  const chosen = fitting.at(-1) ?? image.variants[0];
  if (!chosen) throw new DomainError('COMMON_INTERNAL_ERROR');
  return chosen.path;
}

function playback(row: Pick<StoredVideo, 'provider' | 'kind' | 'providerId'>) {
  return SafeVideoPlaybackSchema.parse(
    videoPlayback(VideoSourceSchema.parse({
      provider: row.provider,
      kind: row.kind,
      providerId: row.providerId,
    })),
  );
}

export function toVideoDto(row: StoredVideo): Video {
  return VideoSchema.parse({
    id: row.id,
    businessId: row.businessId,
    provider: row.provider,
    kind: row.kind,
    providerId: row.providerId,
    status: row.status,
    caption: row.caption,
    hashtags: row.hashtags,
    showInGallery: row.showInGallery,
    showInReels: row.showInReels,
    version: row.version,
    createdAt: row.createdAt,
    playback: playback(row),
  });
}

export function toPublicVideoCard(
  row: PublicVideoRecord,
  surface: 'gallery' | 'reels',
): PublicVideoCard {
  const viewCount = Number(row.viewCount);
  if (!Number.isSafeInteger(viewCount) || viewCount < 0)
    throw new DomainError('COMMON_INTERNAL_ERROR');
  return PublicVideoCardSchema.parse({
    videoId: row.id,
    businessId: row.businessId,
    provider: row.provider,
    providerKind: row.kind,
    providerId: row.providerId,
    caption: row.caption,
    hashtags: row.hashtags,
    playback: playback(row),
    thumbnail: row.thumbnail
      ? publicImage(row.thumbnail, { placementType: 'video', placementId: row.id, surface })
      : null,
    viewCount,
    createdAt: row.createdAt,
  });
}
