import type { TxContext } from '../../../shared/persistence/ports';

export const VIDEO_HEART_REPOSITORY = Symbol('VIDEO_HEART_REPOSITORY');

export interface VideoHeartRepository {
  findOwned(
    tx: TxContext,
    userId: string | null,
    videoIds: readonly string[],
  ): Promise<string[]>;
  set(
    tx: TxContext,
    input: { userId: string; videoId: string; at: Date } & (
      { hearted: true; mediaKind: 'video' | 'reel' } | { hearted: false }
    ),
  ): Promise<void>;
}
