import type { BusinessKind } from '@apnatown/shared/businesses';
import type { SessionBinding } from '../../../shared/auth';
import type { TxContext } from '../../../shared/persistence/ports';

export interface StoredVideo {
  id: string;
  businessId: string;
  provider: 'youtube' | 'instagram';
  kind: 'watch' | 'shorts' | 'share' | 'reel' | 'p';
  providerId: string;
  caption: string;
  hashtags: string[];
  showInGallery: boolean;
  showInReels: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'removed';
  version: number;
  createdAt: string;
}

export interface VideoPosition {
  createdAt: string;
  id: string;
}

export interface VideoModerationScope {
  platformWide: boolean;
  cityWideIds: readonly string[];
  areaIds: readonly string[];
}

export interface StoredModerationVideo extends StoredVideo {
  decisionReason: string | null;
  approvedAt: string | null;
  ownerDeletedAt: string | null;
  businessNameEn: string | null;
  businessNameHi: string | null;
  cityId: string | null;
  areaId: string | null;
}

export interface VideoModerationCounts {
  pending: number;
  approved: number;
  rejected: number;
  removed: number;
  reported: number;
}

export interface StoredVideoReport {
  reportId: string;
  videoId: string;
  reason: 'inappropriate' | 'misleading' | 'spam' | 'copyright' | 'other';
  details: string | null;
  status: 'open' | 'resolved';
  resolution: 'dismissed' | 'removed' | null;
  reportVersion: number;
  targetVersion: number;
  createdAt: string;
  video: StoredModerationVideo;
}

export interface VideoReportPosition {
  createdAt: string;
  id: string;
}

export const VIDEO_REPOSITORY = Symbol('VIDEO_REPOSITORY');
export interface VideoRepository {
  insert(tx: TxContext, row: StoredVideo): Promise<void>;
  mine(
    tx: TxContext,
    input: {
      businessId: string;
      limit: number;
      after?: VideoPosition;
    },
  ): Promise<StoredVideo[]>;
  findPublic(tx: TxContext, id: string): Promise<StoredVideo | null>;
  findForComments(
    tx: TxContext,
    id: string,
  ): Promise<{
    id: string;
    businessId: string;
    cityId: string | null;
    areaId: string | null;
    public: boolean;
  } | null>;
  moderationPage(
    tx: TxContext,
    input: {
      tab: StoredVideo['status'];
      scope: VideoModerationScope;
      limit: number;
      after?: VideoPosition;
    },
  ): Promise<StoredModerationVideo[]>;
  moderationCounts(
    tx: TxContext,
    scope: VideoModerationScope,
  ): Promise<VideoModerationCounts>;
  reportedPage(
    tx: TxContext,
    input: {
      scope: VideoModerationScope;
      limit: number;
      after?: VideoReportPosition;
    },
  ): Promise<StoredVideoReport[]>;
  insertVideoReport(
    tx: TxContext,
    input: {
      id: string;
      videoId: string;
      businessId: string;
      reporterUserId: string | null;
      reporterSubjectHash: Uint8Array;
      reason: StoredVideoReport['reason'];
      details: string | null;
      createdAt: Date;
    },
  ): Promise<string>;
  findReportForModeration(
    tx: TxContext,
    id: string,
  ): Promise<StoredVideoReport | null>;
  resolveReport(
    tx: TxContext,
    input: {
      reportId: string;
      expectedVersion: number;
      targetVersion: number;
      action: 'dismiss' | 'remove';
      reason: string | null;
      resolvedAt: Date;
    },
  ): Promise<{
    reportVersion: number;
    targetStatus: StoredVideo['status'];
    targetVersion: number;
  } | null>;
  findForModeration(
    tx: TxContext,
    id: string,
  ): Promise<StoredModerationVideo | null>;
  decide(
    tx: TxContext,
    input: {
      id: string;
      expectedVersion: number;
      status: StoredVideo['status'];
      decisionReason: string | null;
      approvedAt: Date | null;
    },
  ): Promise<StoredModerationVideo | null>;
}

export interface VideoOwnerRequest {
  actorId: string;
  correlationId: string;
  key: unknown;
  session: SessionBinding;
  businessKind?: BusinessKind;
}

export interface VideoReportRequest {
  reporterUserId: string | null;
  correlationId: string;
  key: unknown;
  session: SessionBinding;
}

export interface VideoModerationRequest {
  actorId: string;
  correlationId: string;
  key: unknown;
  session: SessionBinding;
}
