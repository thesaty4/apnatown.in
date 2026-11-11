import { Inject, Injectable } from '@nestjs/common';
import type { Logger } from 'pino';
import { RUNTIME_CONFIG, type RuntimeConfig } from '../config/config';
import { RUNTIME_LOGGER } from '../logger/logger';
import { RuntimeCleanupStore } from '../persistence/runtime-cleanup-store';

@Injectable()
export class RuntimeCleanup {
  private timer: NodeJS.Timeout | undefined;
  private task: Promise<void> | undefined;
  private stopping = false;

  constructor(
    private readonly store: RuntimeCleanupStore,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
    @Inject(RUNTIME_LOGGER) private readonly logger: Logger,
  ) {}

  start(): void {
    if (this.stopping) throw new Error('RUNTIME_CLEANUP_STOPPED');
    if (this.timer) return;
    this.timer = setInterval(
      () => this.tick(),
      this.config.RUNTIME_CLEANUP_INTERVAL_MS,
    );
    this.timer.unref();
    this.tick();
  }

  async stop(): Promise<void> {
    this.stopping = true;
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    await this.task;
  }

  onModuleDestroy(): Promise<void> {
    return this.stop();
  }

  private tick(): void {
    if (this.stopping || this.task) return;
    this.task = this.cleanup().finally(() => {
      this.task = undefined;
    });
  }

  private async cleanup(): Promise<void> {
    try {
      const counts = await this.store.cleanupBatch(
        this.config.RUNTIME_CLEANUP_BATCH_SIZE,
      );
      if (counts.rateLimitBuckets > 0 || counts.idempotencyKeys > 0)
        this.logger.info({ event: 'runtime.cleanup_completed', ...counts });
    } catch {
      this.logger.error({
        event: 'runtime.cleanup_failed',
        code: 'RUNTIME_CLEANUP_FAILED',
      });
    }
  }
}
