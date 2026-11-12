import type { TxContext } from '../../../shared/persistence/ports';

export const SERVICE_BOOKMARK_REPOSITORY = Symbol('SERVICE_BOOKMARK_REPOSITORY');
export interface ServiceBookmarkRow {
  targetType: 'service'; targetId: string; createdAt: string;
}
export interface ServiceBookmarkRepository {
  findOwned(tx: TxContext, userId: string | null, serviceIds: readonly string[]): Promise<string[]>;
  set(tx: TxContext, input: { userId: string; serviceId: string; bookmarked: boolean; at: Date }): Promise<void>;
  page(tx: TxContext, input: {
    userId: string; limit: number; after?: { createdAt: string; targetId: string };
  }): Promise<ServiceBookmarkRow[]>;
  eraseForUser(tx: TxContext, userId: string): Promise<void>;
}
