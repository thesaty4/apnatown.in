import type { TxContext } from '../../../shared/persistence/ports';

export const MEDIA_COMMENT_TARGET = Symbol('MEDIA_COMMENT_TARGET');

export interface MediaCommentTarget {
  readonly id: string;
  readonly businessId: string;
  readonly cityId: string | null;
  readonly areaId: string | null;
  readonly public: boolean;
  readonly mediaKind: 'video' | 'reel';
}

/** Purpose-limited current video visibility and business-scope lookup. */
export interface MediaCommentTargetPort {
  find(tx: TxContext, videoId: string): Promise<MediaCommentTarget | null>;
}
