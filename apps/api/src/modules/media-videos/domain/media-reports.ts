import type { MediaPhotoPlacementType } from '@apnatown/shared';
import type { TxContext } from '../../../shared/persistence/ports';
import type { StoredPublicImage } from './media-gallery';
import type { StoredVideoReport, VideoModerationScope, VideoReportPosition } from './videos';

export const MEDIA_PHOTO_REPORTS = Symbol('MEDIA_PHOTO_REPORTS');

export interface StoredPhotoReport {
  reportId: string;
  assetId: string;
  placementType: MediaPhotoPlacementType;
  placementId: string;
  businessId: string;
  businessNameEn: string | null;
  businessNameHi: string | null;
  cityId: string | null;
  areaId: string | null;
  reason: StoredVideoReport['reason'];
  details: string | null;
  status: 'open' | 'resolved';
  resolution: 'dismissed' | 'removed' | null;
  reportVersion: number;
  createdAt: string;
  /** Media asset moderation state and version (the report target). */
  moderationState: 'allowed' | 'removed';
  targetVersion: number;
  /** Ready variants while the reported placement is currently public. */
  publicImage: StoredPublicImage | null;
}

export interface PhotoReportRepository {
  page(tx: TxContext, input: {
    scope: VideoModerationScope; limit: number; after?: VideoReportPosition;
  }): Promise<StoredPhotoReport[]>;
  openCount(tx: TxContext, scope: VideoModerationScope): Promise<number>;
  /** Report target kind, or null when the report does not exist. */
  kind(tx: TxContext, reportId: string): Promise<'video' | 'photo' | null>;
  find(tx: TxContext, reportId: string, lock: boolean): Promise<StoredPhotoReport | null>;
  /** Marks the asset removed (hidden from every public placement); null on version race. */
  removeAsset(tx: TxContext, input: { assetId: string; expectedVersion: number }): Promise<number | null>;
  resolve(tx: TxContext, input: {
    reportId: string; expectedVersion: number; resolution: 'dismissed' | 'removed'; resolvedAt: Date;
  }): Promise<number | null>;
}
