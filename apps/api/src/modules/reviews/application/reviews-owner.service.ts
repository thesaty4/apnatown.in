import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  OwnerReviewCardSchema,
  OwnerReviewPageSchema,
  ReviewReportResultSchema,
  type OwnerReviewCard,
  type OwnerReviewPage,
  type OwnerReviewQuery,
  type ReviewReport,
} from '@apnatown/shared/reviews';
import { IdSchema, TimestampSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import { DomainError } from '../../../shared/errors/errors';
import { CURSOR_CODEC, type CursorCodec } from '../../../shared/pagination/cursor';
import { UNIT_OF_WORK, type TxContext, type UnitOfWork } from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import {
  ApprovedSellerAccess,
  type SellerRequest,
} from '../../businesses/application/approved-seller-access';
import {
  REVIEW_OWNER_REPOSITORY,
  reporterSubject,
  type OwnerReviewRow,
  type ReviewOwnerRepository,
} from '../domain/owner-reviews';
import { toReviewCard } from '../domain/reviews';

const position = z.tuple([TimestampSchema, IdSchema]);

/**
 * Owner reviews (F-VD-010, F-RV-007): list/filter, reply (overwrite or
 * clear) and Report abusive, always on the caller's own APPROVED business.
 * Foreign/invisible reviews are REVIEW_NOT_FOUND (no existence oracle).
 */
@Injectable()
export class ReviewsOwnerService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(REVIEW_OWNER_REPOSITORY) private readonly reviews: ReviewOwnerRepository,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly sellers: ApprovedSellerAccess,
  ) {}

  page(request: SellerRequest, query: OwnerReviewQuery): Promise<OwnerReviewPage> {
    return this.uow.run(async (tx) => {
      const business = await this.sellers.resolve(tx, request);
      const binding = {
        operation: 'reviews.owner.list',
        sort: 'recent',
        filters: { filter: query.filter, rating: query.rating ?? null },
        scope: business.id,
      };
      let after = null;
      if (query.cursor) {
        const parsed = position.safeParse(this.cursors.decode(query.cursor, binding));
        if (!parsed.success) throw new DomainError('VALIDATION_ERROR');
        after = { createdAt: parsed.data[0], id: parsed.data[1] };
      }
      const result = await this.reviews.page(tx, {
        businessId: business.id,
        subjectHash: reporterSubject(request.actorId),
        filter: query.filter,
        rating: query.rating,
        take: query.limit + 1,
        after,
      });
      const rows = result.rows.slice(0, query.limit);
      const last = rows.at(-1);
      return OwnerReviewPageSchema.parse({
        summary: result.summary,
        counts: result.counts,
        items: rows.map(card),
        nextCursor:
          result.rows.length > query.limit && last
            ? this.cursors.encode(binding, [last.createdAt, last.id])
            : null,
      });
    });
  }

  /** `text === null` clears the reply. */
  reply(request: SellerRequest, reviewId: string, text: string | null): Promise<OwnerReviewCard> {
    return this.uow.run(async (tx) => {
      const business = await this.sellers.resolve(tx, request);
      const changed = await this.reviews.setReply(tx, {
        reviewId,
        businessId: business.id,
        text,
        at: this.clock.now(),
      });
      if (!changed) throw new DomainError('REVIEW_NOT_FOUND');
      return this.read(tx, request, reviewId, business.id);
    });
  }

  /** Owner "Report abusive"; a replay by the same owner is acknowledged once. */
  report(request: SellerRequest, reviewId: string, input: ReviewReport) {
    return this.uow.run(async (tx) => {
      const businessId = await this.reviews.businessOf(tx, reviewId);
      const business = businessId
        ? await this.sellers.forBusiness(tx, request, businessId)
        : null;
      if (!business) throw new DomainError('REVIEW_NOT_FOUND');
      await this.reviews.report(tx, {
        id: randomUUID(),
        reviewId,
        reporterUserId: request.actorId,
        subjectHash: reporterSubject(request.actorId),
        report: input,
        at: this.clock.now(),
      });
      return ReviewReportResultSchema.parse({ reported: true });
    });
  }

  private async read(
    tx: TxContext,
    request: SellerRequest,
    reviewId: string,
    businessId: string,
  ): Promise<OwnerReviewCard> {
    const row = await this.reviews.find(tx, {
      reviewId,
      businessId,
      subjectHash: reporterSubject(request.actorId),
    });
    if (!row) throw new DomainError('REVIEW_NOT_FOUND');
    return OwnerReviewCardSchema.parse(card(row));
  }
}

function card(row: OwnerReviewRow) {
  return {
    ...toReviewCard(row),
    targetType: row.targetType,
    targetNameEn: row.targetNameEn,
    targetNameHi: row.targetNameHi,
    reportedByMe: row.reportedByMe,
  };
}
