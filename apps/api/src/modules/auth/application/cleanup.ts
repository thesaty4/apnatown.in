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

export const AUTH_CLEANUP = Symbol('AUTH_CLEANUP');
export interface AuthCleanup {
  batch(limit: number): Promise<void>;
}

@Injectable()
export class AuthCleanupScheduler implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private pending: Promise<void> | undefined;
  constructor(
    @Inject(AUTH_CLEANUP) private readonly cleanup: AuthCleanup,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
    @Inject(RUNTIME_LOGGER) private readonly logger: Logger,
  ) {}
  onModuleInit(): void {
    this.timer = setInterval(() => {
      if (this.pending) return;
      this.pending = this.cleanup
        .batch(this.config.RUNTIME_CLEANUP_BATCH_SIZE)
        .catch(() => this.logger.error({ event: 'auth.cleanup.failed' }))
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
