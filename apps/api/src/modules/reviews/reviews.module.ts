import { Module, type DynamicModule } from '@nestjs/common';
import { ApprovedSellerAccess } from '../businesses/application/approved-seller-access';
import { ReviewsOwnerService } from './application/reviews-owner.service';
import { ReviewsSelfService } from './application/reviews-self.service';
import { ReviewsPublicService } from './application/reviews-public.service';
import { REVIEW_OWNER_REPOSITORY } from './domain/owner-reviews';
import { MY_REVIEWS_REPOSITORY } from './domain/my-reviews';
import { REVIEW_PUBLIC_READ } from './domain/reviews';
import { PrismaReviewOwnerRepository } from './infrastructure/prisma-review-owner.repository';
import { PrismaMyReviewsRepository } from './infrastructure/prisma-my-reviews.repository';
import { PrismaReviewPublicReadRepository } from './infrastructure/prisma-review-public-read.repository';
import { ReviewsOwnerController } from './presentation/reviews-owner.controller';
import { ReviewsSelfController } from './presentation/reviews-self.controller';
import { ReviewsPublicController } from './presentation/reviews-public.controller';

/**
 * Public review reads plus the owner side (list, reply, Report abusive).
 * Review creation/edit, helpful votes, public reporting and moderation
 * still wait for the BR-09/RV-Q1/RV-Q2 gates. Imports: runtime
 * (PrismaDatabase, UoW, CURSOR_CODEC, CLOCK) and BusinessContext
 * (BusinessOwnerContext for ApprovedSellerAccess).
 */
@Module({})
export class ReviewsModule {
  static forRoot(imports: readonly DynamicModule[]): DynamicModule {
    return {
      module: ReviewsModule,
      imports: [...imports],
      controllers: [
        ReviewsPublicController,
        ReviewsOwnerController,
        ReviewsSelfController,
      ],
      providers: [
        ReviewsPublicService,
        ReviewsOwnerService,
        ReviewsSelfService,
        ApprovedSellerAccess,
        { provide: REVIEW_PUBLIC_READ, useClass: PrismaReviewPublicReadRepository },
        { provide: REVIEW_OWNER_REPOSITORY, useClass: PrismaReviewOwnerRepository },
        { provide: MY_REVIEWS_REPOSITORY, useClass: PrismaMyReviewsRepository },
      ],
    };
  }
}
