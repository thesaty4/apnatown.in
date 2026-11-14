import { Inject, Injectable } from '@nestjs/common';
import { MyReviewPageSchema } from '@apnatown/shared/reviews';
import {
  SESSION_ACCESS,
  type SessionAccess,
  type SessionBinding,
} from '../../../shared/auth/ports';
import { UNIT_OF_WORK, type UnitOfWork } from '../../../shared/persistence/ports';
import {
  MY_REVIEWS_REPOSITORY,
  type MyReviewsRepository,
} from '../domain/my-reviews';

/** Read-only self list for the account "My reviews" screen. */
@Injectable()
export class ReviewsSelfService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(MY_REVIEWS_REPOSITORY)
    private readonly reviews: MyReviewsRepository,
  ) {}

  mine(session: SessionBinding) {
    return this.uow.run(async (tx) => {
      const principal = await this.sessions.requirePrincipal(tx, session);
      return MyReviewPageSchema.parse({
        items: await this.reviews.mine(tx, principal.userId),
      });
    });
  }
}
