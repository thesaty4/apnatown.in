import { Controller, Get, Header, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MyReviewPageSchema } from '@apnatown/shared/reviews';
import { createZodDto } from 'nestjs-zod';
import { Roles, sessionBinding, type AuthRequest } from '../../../shared/auth';
import { PrivateApi } from '../../../shared/auth/openapi';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { ReviewsSelfService } from '../application/reviews-self.service';

class MyReviewPageDto extends createZodDto(MyReviewPageSchema) {}

/** S-CUST-23 "My reviews": the signed-in customer's own review history. */
@ApiTags('reviews')
@PrivateApi()
@Controller('reviews')
export class ReviewsSelfController {
  constructor(private readonly reviews: ReviewsSelfService) {}

  @Get('me')
  @Roles('customer')
  @Header('Cache-Control', 'private, no-store')
  @RateLimit({
    key: 'reviews.self-read',
    subject: 'principal',
    maximumHits: 60,
    windowSeconds: 60,
  })
  @ApiOperation({
    operationId: 'listMyReviews',
    summary: 'Reviews written by the signed-in customer',
    description:
      'Own non-deleted reviews newest first, including pending/hidden states, with the current public target label/path when it still exists. No other customer data is returned.',
  })
  @ApiOkResponse({ type: MyReviewPageDto })
  async mine(@Req() request: AuthRequest) {
    return MyReviewPageSchema.parse(
      await this.reviews.mine(sessionBinding(request)),
    );
  }
}
