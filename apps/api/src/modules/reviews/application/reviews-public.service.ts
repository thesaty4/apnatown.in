import { Inject, Injectable } from '@nestjs/common';
import {
  ReviewPageSchema,
  type ReviewListQuery,
  type ReviewPage,
} from '@apnatown/shared/reviews';
import { CountSchema, IdSchema, TimestampSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import { DomainError } from '../../../shared/errors/errors';
import {
  CURSOR_CODEC,
  type CursorBinding,
  type CursorCodec,
} from '../../../shared/pagination/cursor';
import {
  REVIEW_PUBLIC_READ,
  type PublicReviewRow,
  type ReviewPosition,
  type ReviewPublicReadRepository,
  toReviewCard,
} from '../domain/reviews';

const recentPosition = z.tuple([TimestampSchema, IdSchema]);
const helpfulPosition = z.tuple([CountSchema, TimestampSchema, IdSchema]);

@Injectable()
export class ReviewsPublicService {
  constructor(
    @Inject(REVIEW_PUBLIC_READ)
    private readonly reviews: ReviewPublicReadRepository,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
  ) {}

  async page(query: ReviewListQuery): Promise<ReviewPage> {
    // Cursor is bound to the exact target and sort; it cannot be replayed elsewhere.
    const binding: CursorBinding = {
      operation: 'reviews.public.list',
      sort: query.sort,
      filters: { targetType: query.targetType, targetId: query.targetId },
      scope: null,
    };
    const result = await this.reviews.page({
      targetType: query.targetType,
      targetId: query.targetId,
      sort: query.sort,
      take: query.limit + 1,
      after: this.position(query.cursor, binding, query.sort),
    });
    if (!result) throw new DomainError('COMMON_NOT_FOUND');
    const rows = result.rows.slice(0, query.limit);
    const last = rows.at(-1);
    return ReviewPageSchema.parse({
      summary: result.summary,
      items: rows.map(toReviewCard),
      nextCursor:
        result.rows.length > query.limit && last
          ? this.cursors.encode(binding, keys(query.sort, last))
          : null,
    });
  }

  private position(
    cursor: string | undefined,
    binding: CursorBinding,
    sort: ReviewListQuery['sort'],
  ): ReviewPosition | null {
    if (!cursor) return null;
    const decoded = this.cursors.decode(cursor, binding);
    if (sort === 'recent') {
      const parsed = recentPosition.safeParse(decoded);
      if (!parsed.success) throw new DomainError('VALIDATION_ERROR');
      return { sort, createdAt: parsed.data[0], id: parsed.data[1] };
    }
    const parsed = helpfulPosition.safeParse(decoded);
    if (!parsed.success) throw new DomainError('VALIDATION_ERROR');
    return {
      sort,
      helpfulCount: parsed.data[0],
      createdAt: parsed.data[1],
      id: parsed.data[2],
    };
  }
}

function keys(sort: ReviewListQuery['sort'], row: PublicReviewRow) {
  return sort === 'recent'
    ? [row.createdAt, row.id]
    : [row.helpfulCount, row.createdAt, row.id];
}
