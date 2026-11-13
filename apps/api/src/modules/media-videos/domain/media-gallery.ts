import type {
  BusinessGalleryFilter,
  MediaLinkTarget,
  MediaPhotoPlacementType,
} from '@apnatown/shared';
import type { TxContext } from '../../../shared/persistence/ports';
import type { StoredVideo } from './videos';

export const MEDIA_GALLERY_REPOSITORY = Symbol('MEDIA_GALLERY_REPOSITORY');
export const MEDIA_OWNER_VIDEO_REPOSITORY = Symbol('MEDIA_OWNER_VIDEO_REPOSITORY');
export const MEDIA_PUBLIC_READ_REPOSITORY = Symbol('MEDIA_PUBLIC_READ_REPOSITORY');

export type MediaManagerList = 'videos' | 'gallery';

/** Stored ready variant descriptor as projected by the public views. */
export interface StoredPublicImage {
  assetId: string;
  version: number;
  width: number;
  height: number;
  variants: unknown;
}

export interface StoredGalleryPhoto {
  id: string;
  businessId: string;
  assetId: string;
  caption: string | null;
  linkedTarget: MediaLinkTarget | null;
  sortOrder: number;
  moderationState: 'allowed' | 'removed';
  version: number;
  createdAt: string;
}

export interface OwnerListPosition {
  sortOrder: number;
  id: string;
}

export interface GalleryRepository {
  page(tx: TxContext, input: {
    businessId: string; limit: number; after?: OwnerListPosition;
  }): Promise<StoredGalleryPhoto[]>;
  find(tx: TxContext, input: {
    businessId: string; id: string; lock: boolean;
  }): Promise<StoredGalleryPhoto | null>;
  /** Live photos count and next free sort position (caller holds the order lock). */
  stats(tx: TxContext, businessId: string): Promise<{ count: number; nextSortOrder: number }>;
  insert(tx: TxContext, row: StoredGalleryPhoto, at: Date): Promise<'created' | 'asset_in_use'>;
  update(tx: TxContext, input: {
    id: string; caption: string | null; linkedTarget: MediaLinkTarget | null; at: Date;
  }): Promise<StoredGalleryPhoto>;
  softDelete(tx: TxContext, id: string, at: Date): Promise<void>;
  /** Returns how many of the targets are public items of this business. */
  countPublicTargets(tx: TxContext, businessId: string, targets: readonly MediaLinkTarget[]): Promise<number>;
  /** Locks (creating if absent) the manager list order row; returns its version. */
  lockOrder(tx: TxContext, businessId: string, list: MediaManagerList): Promise<number>;
  orderVersion(tx: TxContext, businessId: string, list: MediaManagerList): Promise<number>;
  bumpOrder(tx: TxContext, businessId: string, list: MediaManagerList, at: Date): Promise<number>;
  /** Current manager list membership in display order. */
  orderedIds(tx: TxContext, businessId: string, list: MediaManagerList): Promise<string[]>;
  applyOrder(tx: TxContext, businessId: string, list: MediaManagerList, ids: readonly string[], at: Date): Promise<void>;
}

export interface StoredOwnerVideo extends StoredVideo {
  decisionReason: string | null;
  ownerDeletedAt: string | null;
  thumbnailAssetId: string | null;
  links: MediaLinkTarget[];
}

export interface OwnerVideoChange {
  id: string;
  expectedVersion: number;
  source: Pick<StoredVideo, 'provider' | 'kind' | 'providerId'>;
  caption: string;
  hashtags: string[];
  showInGallery: boolean;
  showInReels: boolean;
  thumbnailAssetId: string | null;
  status: StoredVideo['status'];
  /** Clears approval/decision when the video re-enters moderation. */
  resetModeration: boolean;
  links: MediaLinkTarget[] | null;
  at: Date;
}

export interface OwnerVideoRepository {
  find(tx: TxContext, input: {
    businessId: string; id: string; lock: boolean;
  }): Promise<StoredOwnerVideo | null>;
  update(tx: TxContext, change: OwnerVideoChange): Promise<boolean>;
  ownerDelete(tx: TxContext, input: { id: string; expectedVersion: number; at: Date }): Promise<boolean>;
}

export interface PublicVideoRecord {
  id: string;
  businessId: string;
  provider: StoredVideo['provider'];
  kind: StoredVideo['kind'];
  providerId: string;
  caption: string;
  hashtags: string[];
  viewCount: string;
  createdAt: string;
  rankOrder: number;
  thumbnail: StoredPublicImage | null;
}

export interface PublicGalleryRecord {
  rankGroup: number;
  rankOrder: number;
  rankKey: string;
  itemKind: 'photo' | 'video';
  placementType: MediaPhotoPlacementType | null;
  placementId: string | null;
  videoId: string | null;
  caption: string | null;
  linkedTarget: MediaLinkTarget | null;
  image: StoredPublicImage | null;
}

export interface GalleryPosition { group: number; order: number; key: string }
export interface VideoListPosition { order: number; id: string }
export interface LinkedVideoPosition { createdAt: string; id: string }

export interface PublicMediaReadRepository {
  publicBusinessId(tx: TxContext, slug: string): Promise<string | null>;
  galleryPage(tx: TxContext, input: {
    businessId: string; filter: BusinessGalleryFilter; limit: number; after?: GalleryPosition;
  }): Promise<PublicGalleryRecord[]>;
  videosByIds(tx: TxContext, ids: readonly string[]): Promise<PublicVideoRecord[]>;
  businessVideos(tx: TxContext, input: {
    businessId: string; limit: number; after?: VideoListPosition;
  }): Promise<PublicVideoRecord[]>;
  linkedVideos(tx: TxContext, input: {
    target: MediaLinkTarget; limit: number; after?: LinkedVideoPosition;
  }): Promise<PublicVideoRecord[]>;
  /** Business of a currently public photo placement, or null. */
  photoPlacementBusiness(tx: TxContext, input: {
    assetId: string; placementType: MediaPhotoPlacementType; placementId: string;
  }): Promise<string | null>;
  insertPhotoReport(tx: TxContext, input: {
    id: string; assetId: string; placementType: MediaPhotoPlacementType; placementId: string;
    businessId: string; reporterUserId: string | null; reporterSubjectHash: Uint8Array;
    reason: string; details: string | null; createdAt: Date;
  }): Promise<string>;
}
