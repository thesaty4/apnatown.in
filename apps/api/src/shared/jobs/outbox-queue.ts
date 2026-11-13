import { Inject, Injectable } from '@nestjs/common';
import type { PgBoss } from 'pg-boss' with { 'resolution-mode': 'import' };
import type { Logger } from 'pino';
import { RUNTIME_LOGGER } from '../logger/logger';

export const OUTBOX_QUEUE_NAME = 'apnatown.outbox';
export const PG_BOSS_FACTORY = Symbol('PG_BOSS_FACTORY');
export type PgBossFactory = () => Promise<PgBoss>;

@Injectable()
export class OutboxQueue {
  private boss: PgBoss | undefined;
  private opening: Promise<PgBoss> | undefined;
  private closing: Promise<void> | undefined;
  private stopping = false;

  constructor(
    @Inject(PG_BOSS_FACTORY) private readonly createBoss: PgBossFactory,
    @Inject(RUNTIME_LOGGER) private readonly logger: Logger,
  ) {}

  connect(): Promise<PgBoss> {
    if (this.stopping) return Promise.reject(new Error('OUTBOX_QUEUE_STOPPED'));
    if (this.boss) return Promise.resolve(this.boss);
    return (this.opening ??= this.open().finally(() => {
      this.opening = undefined;
    }));
  }

  stop(): Promise<void> {
    this.stopping = true;
    return (this.closing ??= this.close());
  }

  onModuleDestroy(): Promise<void> {
    return this.stop();
  }

  private async open(): Promise<PgBoss> {
    const candidate = await this.createBoss();
    candidate.on('error', () => {
      this.logger.error({
        event: 'outbox.queue_error',
        code: 'OUTBOX_QUEUE_OPERATION_FAILED',
      });
    });
    candidate.on('warning', () => {
      this.logger.warn({
        event: 'outbox.queue_warning',
        code: 'OUTBOX_QUEUE_WARNING',
      });
    });
    try {
      if (this.stopping) throw new Error('OUTBOX_QUEUE_STOPPED');
      await candidate.start({ attempts: 1 });
      if (!(await candidate.getQueue(OUTBOX_QUEUE_NAME)))
        throw new Error('OUTBOX_QUEUE_NOT_PROVISIONED');
      if (this.stopping) throw new Error('OUTBOX_QUEUE_STOPPED');
      this.boss = candidate;
      return candidate;
    } catch {
      this.logger.error({
        event: 'outbox.queue_unavailable',
        code: 'OUTBOX_QUEUE_START_FAILED',
      });
      try {
        await candidate.stop({ close: true, graceful: false, timeout: 5000 });
      } catch {
        this.logger.error({
          event: 'outbox.queue_cleanup_failed',
          code: 'OUTBOX_QUEUE_CLEANUP_FAILED',
        });
      }
      throw new Error('OUTBOX_QUEUE_START_FAILED');
    }
  }

  private async close(): Promise<void> {
    try {
      await this.opening;
    } catch {
      this.logger.warn({
        event: 'outbox.queue_start_ended_during_shutdown',
        code: 'OUTBOX_QUEUE_START_FAILED',
      });
    }
    if (this.boss) {
      const boss = this.boss;
      this.boss = undefined;
      await boss.stop({ close: true, graceful: true, timeout: 5000 });
    }
  }
}
