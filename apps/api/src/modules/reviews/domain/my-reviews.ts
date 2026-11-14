import type { MyReview } from '@apnatown/shared/reviews';
import type { TxContext } from '../../../shared/persistence/ports';

export const MY_REVIEWS_REPOSITORY = Symbol('MY_REVIEWS_REPOSITORY');

/** The caller's own reviews (all non-deleted moderation states). */
export interface MyReviewsRepository {
  mine(tx: TxContext, userId: string): Promise<MyReview[]>;
}
