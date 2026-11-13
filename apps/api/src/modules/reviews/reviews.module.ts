import { Module, type DynamicModule } from '@nestjs/common';
import { ApprovedSellerAccess } from '../businesses/application/approved-seller-access';
import { ReviewsOwnerService } from './application/reviews-owner.service';
import { ReviewsPublicService } from './application/reviews-public.service';
import { REVIEW_OWNER_REPOSITORY } from './domain/owner-reviews';
import { REVIEW_PUBLIC_READ } from './domain/reviews';
import { PrismaReviewOwnerRepository } from './infrastructure/prisma-review-owner.repository';
import { PrismaReviewPublicReadRepository } from './infrastructure/prisma-review-public-read.repository';
import { ReviewsOwnerController } from './presentation/reviews-owner.controller';
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
      controllers: [ReviewsPublicController, ReviewsOwnerController],
      providers: [
        ReviewsPublicService,
        ReviewsOwnerService,
        ApprovedSellerAccess,
        { provide: REVIEW_PUBLIC_READ, useClass: PrismaReviewPublicReadRepository },
        { provide: REVIEW_OWNER_REPOSITORY, useClass: PrismaReviewOwnerRepository },
      ],
    };
  }
}
