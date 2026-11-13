import { Inject, Injectable } from '@nestjs/common';
import {
  RIDER_TIME_ZONE,
  RiderOnlineStateSchema,
  RiderSummarySchema,
  type RiderLocationInput,
  type RiderOnlineInput,
  type RiderOnlineState,
  type RiderSummary,
} from '@apnatown/shared/delivery';
import { DomainError } from '../../../shared/errors/errors';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import {
  RIDER_REPOSITORY,
  type RiderRepository,
} from '../domain/rider';
import {
  DELIVERY_JOB_READ,
  type DeliveryJobReadPort,
} from './delivery-ports';
import { RiderAccess, type RiderRequest } from './rider-access';
import { rollingPeriod } from './rider-periods';

/**
 * Rider availability and home summary (F-RD-002, F-RD-004 location, BR-06).
 * Online state and location are operational: they lock the rider row (the
 * same lock acceptance/suspension use) but do not bump the application
 * version. Location keeps the latest point only and is never logged.
 */
@Injectable()
export class RiderWorkService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(RIDER_REPOSITORY) private readonly riders: RiderRepository,
    @Inject(DELIVERY_JOB_READ) private readonly jobs: DeliveryJobReadPort,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly access: RiderAccess,
  ) {}

  /** Idempotent by state; going offline is refused during an active job. */
  setOnline(
    request: RiderRequest,
    input: RiderOnlineInput,
  ): Promise<RiderOnlineState> {
    return this.uow.run(async (tx) => {
      const rider = await this.access.approved(tx, request, true);
      const at = this.clock.now();
      if (rider.isOnline !== input.online) {
        if (!input.online && (await this.jobs.activeJobId(tx, rider.userId)))
          throw new DomainError('RIDER_HAS_ACTIVE_JOB');
        await this.riders.setOnline(tx, {
          userId: rider.userId,
          online: input.online,
          at,
        });
      }
      return RiderOnlineStateSchema.parse({
        online: input.online,
        approvalStatus: rider.status,
        asOf: at.toISOString(),
      });
    });
  }

  recordLocation(
    request: RiderRequest,
    input: RiderLocationInput,
  ): Promise<void> {
    return this.uow.run(async (tx) => {
      const rider = await this.access.approved(tx, request);
      if (
        !(await this.riders.recordLocation(tx, {
          userId: rider.userId,
          lat: input.lat,
          lng: input.lng,
          at: this.clock.now(),
        }))
      )
        throw new DomainError('RIDER_NOT_ONLINE');
    });
  }

  /** Rolling 24 h [asOf-24h, asOf) by earned timestamp (final js10.js). */
  summary(request: RiderRequest): Promise<RiderSummary> {
    return this.uow.run(async (tx) => {
      const rider = await this.access.rider(tx, request);
      const period = rollingPeriod(this.clock.now(), 'day');
      const totals = await this.jobs.completedTotals(tx, {
        riderUserId: rider.userId,
        from: period.start,
        toExclusive: period.end,
      });
      const activeJobId = await this.jobs.activeJobId(tx, rider.userId);
      return RiderSummarySchema.parse({
        asOf: period.end.toISOString(),
        periodStart: period.start.toISOString(),
        periodEnd: period.end.toISOString(),
        timeZone: RIDER_TIME_ZONE,
        completedCount: totals.count,
        totalPaise: totals.totalPaise,
        online: rider.isOnline,
        approvalStatus: rider.status,
        ...(activeJobId ? { activeJobId } : {}),
      });
    });
  }
}
