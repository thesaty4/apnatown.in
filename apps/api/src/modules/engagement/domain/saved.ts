import type { SavedQuery } from '@apnatown/shared';
import type { TxContext } from '../../../shared/persistence/ports';

export interface SavedPosition {
  savedAt: string;
  targetId: string;
}
export interface SavedRelationship extends SavedPosition {
  targetType: 'business' | 'video' | 'service';
  bellOn: boolean;
  mediaKind: 'video' | 'reel' | null;
}

export const SAVED_REPOSITORY = Symbol('SAVED_REPOSITORY');
export interface SavedRepository {
  page(
    tx: TxContext,
    input: {
      userId: string;
      query: SavedQuery;
      after?: SavedPosition;
    },
  ): Promise<SavedRelationship[]>;
}
