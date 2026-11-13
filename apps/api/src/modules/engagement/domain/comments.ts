import type { ScopeRef } from '@apnatown/shared/admin';
import type { SessionBinding } from '../../../shared/auth/ports';
import type { TxContext } from '../../../shared/persistence/ports';

export type CommentStatus = 'pending' | 'published' | 'removed';
export interface StoredComment {
  id: string;
  videoId: string;
  businessId: string;
  cityId: string | null;
  areaId: string | null;
  authorUserId: string;
  authorLabel: string;
  text: string;
  status: CommentStatus;
  reason: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}
export interface CommentPosition {
  createdAt: string;
  id: string;
}
export interface CommentScope {
  platformWide: boolean;
  cityWideIds: readonly string[];
  areaIds: readonly string[];
}

export const VIDEO_COMMENT_REPOSITORY = Symbol('VIDEO_COMMENT_REPOSITORY');
export interface VideoCommentRepository {
  insert(
    tx: TxContext,
    input: {
      id: string;
      videoId: string;
      authorUserId: string;
      text: string;
      status: CommentStatus;
      at: Date;
    },
  ): Promise<StoredComment>;
  find(tx: TxContext, id: string): Promise<StoredComment | null>;
  publicPage(
    tx: TxContext,
    input: {
      videoId: string;
      authorUserId: string | null;
      public: boolean;
      limit: number;
      after?: CommentPosition;
    },
  ): Promise<StoredComment[]>;
  adminPage(
    tx: TxContext,
    input: {
      status: CommentStatus;
      scope: CommentScope;
      limit: number;
      after?: CommentPosition;
    },
  ): Promise<StoredComment[]>;
  adminCounts(
    tx: TxContext,
    scope: CommentScope,
  ): Promise<{ pending: number; published: number; removed: number }>;
  publishedCount(tx: TxContext, videoId: string): Promise<number>;
  transition(
    tx: TxContext,
    input: {
      id: string;
      expectedVersion: number;
      fromStatus: CommentStatus;
      status: CommentStatus;
      reason: string | null;
      at: Date;
    },
  ): Promise<StoredComment | null>;
  removeByAuthor(
    tx: TxContext,
    input: { id: string; authorUserId: string; at: Date },
  ): Promise<{ comment: StoredComment; fromStatus: CommentStatus } | null>;
}

export interface CommentRequest {
  actorId: string;
  correlationId: string;
  key: unknown;
}
export interface VideoCommentRequest extends CommentRequest {
  session: SessionBinding;
}

export function scopeRef(comment: Pick<StoredComment, 'cityId' | 'areaId'>): ScopeRef {
  return { cityId: comment.cityId, areaId: comment.areaId };
}
