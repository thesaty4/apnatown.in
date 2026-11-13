import { Module, type DynamicModule } from '@nestjs/common';
import { ReviewsPublicService } from './application/reviews-public.service';
import { REVIEW_PUBLIC_READ } from './domain/reviews';
import { PrismaReviewPublicReadRepository } from './infrastructure/prisma-review-public-read.repository';
import { ReviewsPublicController } from './presentation/reviews-public.controller';

/**
 * Public review read side only. Review writes (POST/PATCH, helpful, reports,
 * replies, moderation) wait for Orders proof and the BR-09/RV-Q1/RV-Q2 gates.
 * `runtime` supplies PrismaDatabase and CURSOR_CODEC.
 */
@Module({})
export class ReviewsModule {
  static forRoot(runtime: DynamicModule): DynamicModule {
    return {
      module: ReviewsModule,
      imports: [runtime],
      controllers: [ReviewsPublicController],
      providers: [
        ReviewsPublicService,
        { provide: REVIEW_PUBLIC_READ, useClass: PrismaReviewPublicReadRepository },
      ],
    };
  }
}
