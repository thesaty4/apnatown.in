import type { EngagementState, VideoLikeResult } from '@apnatown/shared';
import type { SessionBinding } from '../../../shared/auth/ports';
import type { TxContext } from '../../../shared/persistence/ports';

export const VIDEO_LIKE_REPOSITORY = Symbol('VIDEO_LIKE_REPOSITORY');

export interface VideoLikeRequest {
  session: SessionBinding;
  correlationId: string;
}

export interface VideoLikeRepository {
  state(
    tx: TxContext,
    userId: string | null,
    videoIds: readonly string[],
    publicVideoIds: readonly string[],
  ): Promise<EngagementState>;
  set(
    tx: TxContext,
    input: { userId: string; videoId: string; liked: boolean; at: Date },
  ): Promise<VideoLikeResult & { changed: boolean; version: number }>;
}
