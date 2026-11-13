import { Inject, Injectable } from '@nestjs/common';
import type { PgBoss } from 'pg-boss' with { 'resolution-mode': 'import' };
import type { Logger } from 'pino';
import { RUNTIME_CONFIG, type RuntimeConfig } from '../config/config';
import { RUNTIME_LOGGER } from '../logger/logger';
import { OutboxDispatcher } from './outbox-dispatcher';
import { OUTBOX_QUEUE_NAME, OutboxQueue } from './outbox-queue';

@Injectable()
export class OutboxConsumer {
  private worker: { boss: PgBoss; id: string } | undefined;
  private registration: Promise<void> | undefined;
  private stoppingTask: Promise<void> | undefined;
  private timer: NodeJS.Timeout | undefined;
  private wake: (() => void) | undefined;
  private stopping = false;

  constructor(
    private readonly queue: OutboxQueue,
    private readonly dispatcher: OutboxDispatcher,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
    @Inject(RUNTIME_LOGGER) private readonly logger: Logger,
  ) {}

  get registered(): boolean {
    return this.worker !== undefined && !this.stopping;
  }

  start(): void {
    if (this.stopping) throw new Error('OUTBOX_CONSUMER_STOPPED');
    if (this.registration) return;
    if (this.dispatcher.handlerCount === 0) {
      this.logger.warn({
        event: 'outbox.consumer_inactive',
        code: 'OUTBOX_HANDLERS_NOT_REGISTERED',
      });
      return;
    }
    this.registration = this.register();
  }

  stop(): Promise<void> {
    this.stopping = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    const wake = this.wake;
    this.wake = undefined;
    wake?.();
    return (this.stoppingTask ??= this.drain());
  }

  onModuleDestroy(): Promise<void> {
    return this.stop();
  }

  private async register(): Promise<void> {
    while (!this.stopping) {
      try {
        const boss = await this.queue.connect();
        if (this.stopping) return;
        const id = await boss.work<unknown, void>(
          OUTBOX_QUEUE_NAME,
          { batchSize: 1, localConcurrency: 1, pollingIntervalSeconds: 1 },
          (jobs) => this.process(jobs),
        );
        this.worker = { boss, id };
        if (!this.stopping)
          this.logger.info({
            event: 'outbox.consumer_registered',
            handlerCount: this.dispatcher.handlerCount,
          });
        return;
      } catch {
        this.logger.error({
          event: 'outbox.consumer_registration_failed',
          code: 'OUTBOX_CONSUMER_REGISTRATION_FAILED',
        });
      }
      if (!this.stopping) await this.wait();
    }
  }

  private async process(jobs: readonly { data: unknown }[]): Promise<void> {
    try {
      const job = jobs[0];
      if (jobs.length !== 1 || !job) throw new Error('OUTBOX_BATCH_INVALID');
      await this.dispatcher.dispatch(job.data);
    } catch {
      this.logger.error({
        event: 'outbox.dispatch_failed',
        code: 'OUTBOX_DISPATCH_FAILED',
      });
      throw new Error('OUTBOX_DISPATCH_FAILED');
    }
  }

  private async drain(): Promise<void> {
    await this.registration;
    if (this.worker) {
      const { boss, id } = this.worker;
      await boss.offWork(OUTBOX_QUEUE_NAME, { id, wait: true });
      this.worker = undefined;
    }
  }

  private wait(): Promise<void> {
    return new Promise((resolve) => {
      this.wake = resolve;
      this.timer = setTimeout(() => {
        this.timer = undefined;
        this.wake = undefined;
        resolve();
      }, this.config.JOB_RETRY_DELAY_MS);
      this.timer.unref();
    });
  }
}
