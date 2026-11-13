import {
  Inject,
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import type { Logger } from 'pino';
import { RUNTIME_LOGGER } from '../../../shared/logger/logger';
import { UNIT_OF_WORK, type UnitOfWork } from '../../../shared/persistence/ports';
import { CLOCK, ID_PROVIDER, type Clock, type IdProvider } from '../../../shared/runtime/providers';
import { DispatchAssignment } from './dispatch-assignment';

const SWEEP_INTERVAL_MS = 5_000;
const SWEEP_BATCH = 20;

/**
 * Worker-only `delivery.offer_expire` sweep (delivery BE "Events and jobs"):
 * every 5 s, each due live offer is expired and requeued in its own UoW
 * (job then offer lock; recheck status/expiry first). Acceptance also
 * rejects an expired offer lazily, so the countdown never extends.
 */
@Injectable()
export class OfferExpiryScheduler implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private pending: Promise<void> | undefined;

  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    @Inject(RUNTIME_LOGGER) private readonly logger: Logger,
    private readonly assignment: DispatchAssignment,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      if (this.pending) return;
      this.pending = this.sweep()
        .catch(() => this.logger.error({ event: 'delivery.offer_sweep_failed' }))
        .finally(() => {
          this.pending = undefined;
        });
    }, SWEEP_INTERVAL_MS);
    this.timer.unref();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    await this.pending;
  }

  private async sweep(): Promise<void> {
    const due = await this.uow.run((tx) => this.assignment.offers.dueIds(tx, this.clock.now(), SWEEP_BATCH));
    let expired = 0;
    for (const offerId of due) {
      const correlationId = `offer-expiry-${this.ids.uuidv7()}`;
      try {
        if (await this.uow.run((tx) => this.assignment.expire(tx, offerId, { at: this.clock.now(), correlationId })))
          expired += 1;
      } catch {
        // Bounded: the offer stays due and is retried on the next tick.
        this.logger.warn({ event: 'delivery.offer_expire_failed', correlationId });
      }
    }
    if (expired) this.logger.info({ event: 'delivery.offers_expired', count: expired });
  }
}
