import type { TxContext } from '../../../shared/persistence/ports';

export const VIDEO_SHARE_REPOSITORY = Symbol('VIDEO_SHARE_REPOSITORY');

export interface VideoShareRequest {
  actorId: string;
  correlationId: string;
  key: unknown;
}

export interface VideoShareRepository {
  increment(videoId: string, at: Date, tx: TxContext): Promise<{
    shareCount: number;
    version: number;
  }>;
}
