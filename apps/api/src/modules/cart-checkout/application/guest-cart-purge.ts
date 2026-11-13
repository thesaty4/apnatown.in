import {
  Inject,
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import type { Logger } from 'pino';
import {
  RUNTIME_CONFIG,
  type RuntimeConfig,
} from '../../../shared/config/config';
import { RUNTIME_LOGGER } from '../../../shared/logger/logger';

export const GUEST_CART_PURGE_STORE = Symbol('GUEST_CART_PURGE_STORE');
export interface GuestCartPurgeStore {
  /** Deletes up to `limit` guest carts idle longer than `ttlSeconds`. */
  purgeExpired(ttlSeconds: number, limit: number): Promise<number>;
}

/**
 * Q-70 data minimisation: worker-only interval purge of expired guest carts
 * (lines cascade). Mirrors AuthCleanupScheduler; inert when guest carts are
 * disabled (GUEST_CART_TTL_SECONDS unset).
 */
@Injectable()
export class GuestCartPurgeScheduler implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private pending: Promise<void> | undefined;
  constructor(
    @Inject(GUEST_CART_PURGE_STORE) private readonly store: GuestCartPurgeStore,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
    @Inject(RUNTIME_LOGGER) private readonly logger: Logger,
  ) {}
  onModuleInit(): void {
    const ttl = this.config.GUEST_CART_TTL_SECONDS;
    if (ttl === undefined) return;
    this.timer = setInterval(() => {
      if (this.pending) return;
      this.pending = this.store
        .purgeExpired(ttl, this.config.RUNTIME_CLEANUP_BATCH_SIZE)
        .then((carts) => {
          if (carts > 0)
            this.logger.info({ event: 'cart.guest_purge_completed', carts });
        })
        .catch(() => this.logger.error({ event: 'cart.guest_purge_failed' }))
        .finally(() => {
          this.pending = undefined;
        });
    }, this.config.RUNTIME_CLEANUP_INTERVAL_MS);
    this.timer.unref();
  }
  async onModuleDestroy(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    await this.pending;
  }
}
