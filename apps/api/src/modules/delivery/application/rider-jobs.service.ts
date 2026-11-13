import { Inject, Injectable } from '@nestjs/common';
import {
  RIDER_TIME_ZONE,
  RiderCurrentOfferSchema,
  RiderEarningsSchema,
  RiderHistoryPageSchema,
  RiderHistorySchema,
  RiderJobSchema,
  type RiderCurrentOffer,
  type RiderEarnings,
  type RiderEarningsQuery,
  type RiderHistory,
  type RiderHistoryPage,
  type RiderHistoryQuery,
  type RiderJob,
} from '@apnatown/shared/delivery';
import { IdSchema, TimestampSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import { DomainError } from '../../../shared/errors/errors';
import {
  CURSOR_CODEC,
  CursorCodec,
  type CursorBinding,
} from '../../../shared/pagination/cursor';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import {
  DELIVERY_JOB_READ,
  type DeliveryJobReadPort,
} from './delivery-ports';
import { RiderAccess, type RiderRequest } from './rider-access';
import { RiderJobView } from './rider-job-view';
import { rollingPeriod } from './rider-periods';
import { DELIVERY_OFFER_REPOSITORY, type DeliveryOfferRepository } from '../domain/delivery-job';

// [pinned asOf, terminal timestamp, jobId]: pages share one period.
const positionSchema = z.tuple([TimestampSchema, TimestampSchema, IdSchema]);

/**
 * Rider job reads (F-RD-003..006): own offers/jobs/history/earnings only.
 * Offers/jobs/history compose persisted `delivery_jobs`/`delivery_offers`
 * rows with Orders/Payments projections (RiderJobView). Earnings read
 * persisted snapshots, never today's settings; payout stays unavailable
 * until a settlement owner/evidence is approved.
 */
@Injectable()
export class RiderJobsService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(DELIVERY_JOB_READ) private readonly jobs: DeliveryJobReadPort,
    @Inject(DELIVERY_OFFER_REPOSITORY) private readonly offers: DeliveryOfferRepository,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly access: RiderAccess,
    private readonly view: RiderJobView,
  ) {}

  /** Offers exist only for an approved, online rider; otherwise none. */
  currentOffer(request: RiderRequest): Promise<RiderCurrentOffer> {
    return this.uow.run(async (tx) => {
      const rider = await this.access.rider(tx, request);
      const current =
        rider.status === 'approved' && rider.isOnline
          ? await this.offers.currentFor(tx, rider.userId, this.clock.now())
          : null;
      const offer = current ? await this.view.offer(tx, current) : null;
      return RiderCurrentOfferSchema.parse({ offer });
    });
  }

  active(request: RiderRequest): Promise<RiderJob> {
    return this.uow.run(async (tx) => {
      const rider = await this.access.approved(tx, request);
      const job = await this.jobs.activeJob(tx, rider.userId);
      if (!job) throw new DomainError('DELIVERY_JOB_NOT_FOUND');
      return RiderJobSchema.parse(await this.view.job(tx, job));
    });
  }

  history(
    request: RiderRequest,
    query: RiderHistoryQuery,
  ): Promise<RiderHistoryPage> {
    return this.uow.run(async (tx) => {
      const rider = await this.access.rider(tx, request);
      const binding: CursorBinding = {
        operation: 'delivery.rider.history',
        sort: 'terminalAt-id-desc',
        filters: { range: query.range },
        scope: { actor: rider.userId },
      };
      const position = this.position(query.cursor, binding);
      const asOf = position ? new Date(position[0]) : this.clock.now();
      const from =
        query.range === 'all'
          ? null
          : rollingPeriod(asOf, query.range === 'today' ? 'day' : 'week').start;
      const rows = await this.jobs.history(tx, {
        riderUserId: rider.userId,
        from,
        toExclusive: asOf,
        ...(position ? { after: position.slice(1) } : {}),
        limit: query.limit + 1,
      });
      const items = await this.view.history(tx, rows.slice(0, query.limit));
      const last = items.at(-1);
      return RiderHistoryPageSchema.parse({
        items,
        nextCursor:
          rows.length > query.limit && last
            ? this.cursors.encode(binding, [
                asOf.toISOString(),
                terminalAt(last),
                last.jobId,
              ])
            : null,
        periodStart: from?.toISOString() ?? null,
        periodEnd: asOf.toISOString(),
        asOf: asOf.toISOString(),
      });
    });
  }

  historyDetail(request: RiderRequest, jobId: string): Promise<RiderHistory> {
    return this.uow.run(async (tx) => {
      const rider = await this.access.rider(tx, request);
      const job = await this.jobs.historyDetail(tx, {
        riderUserId: rider.userId,
        jobId,
      });
      const [row] = job ? await this.view.history(tx, [job]) : [];
      if (!row) throw new DomainError('DELIVERY_JOB_NOT_FOUND');
      return RiderHistorySchema.parse(row);
    });
  }

  earnings(
    request: RiderRequest,
    query: RiderEarningsQuery,
  ): Promise<RiderEarnings> {
    return this.uow.run(async (tx) => {
      const rider = await this.access.rider(tx, request);
      const period = rollingPeriod(this.clock.now(), query.range);
      const range = { from: period.start, toExclusive: period.end };
      const totals = await this.jobs.completedTotals(tx, {
        riderUserId: rider.userId,
        ...range,
      });
      // First page only; full pagination goes through /history.
      const rides = await this.view.history(
        tx,
        await this.jobs.history(tx, { riderUserId: rider.userId, ...range, limit: 50, deliveredOnly: true }),
      );
      return RiderEarningsSchema.parse({
        asOf: period.end.toISOString(),
        periodStart: period.start.toISOString(),
        periodEnd: period.end.toISOString(),
        timeZone: RIDER_TIME_ZONE,
        completedCount: totals.count,
        totalPaise: totals.totalPaise,
        rides,
        nextCursor: null,
        payout: { availability: 'unavailable', pendingPaise: null, items: [] },
      });
    });
  }

  private position(
    cursor: string | undefined,
    binding: CursorBinding,
  ): [string, string, string] | undefined {
    if (!cursor) return undefined;
    const parsed = positionSchema.safeParse(this.cursors.decode(cursor, binding));
    if (!parsed.success)
      throw new DomainError('COMMON_VALIDATION_FAILED', { field: 'cursor' });
    return parsed.data;
  }
}

function terminalAt(row: RiderHistory): string {
  const { deliveredAt, failedAt, cancelledAt } = row.timestamps;
  return deliveredAt ?? failedAt ?? cancelledAt ?? row.estimate.estimatedAt;
}
