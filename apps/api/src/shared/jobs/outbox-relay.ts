import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { canonicalJson, EventEnvelopeSchema } from '@apnatown/shared';
import type { PgBoss } from 'pg-boss' with { 'resolution-mode': 'import' };
import type { Logger } from 'pino';
import { RUNTIME_CONFIG, type RuntimeConfig } from '../config/config';
import { RUNTIME_LOGGER } from '../logger/logger';
import { withCorrelation } from '../logger/context';
import {
  OutboxRelayStore,
  type OutboxRecord,
} from '../persistence/outbox-relay-store';

const OUTBOX_QUEUE_NAME = 'apnatown.outbox';
const OUTBOX_ENQUEUE_FAILED = 'OUTBOX_ENQUEUE_FAILED';
const OUTBOX_EVENT_INVALID = 'OUTBOX_EVENT_INVALID';

export const PG_BOSS_FACTORY = Symbol('PG_BOSS_FACTORY');
export type PgBossFactory = () => Promise<PgBoss>;

@Injectable()
export class OutboxRelay {
  private boss: PgBoss | undefined;
  private running = false;
  private loop: Promise<void> | undefined;
  private timer: NodeJS.Timeout | undefined;
  private wake: (() => void) | undefined;

  constructor(
    @Inject(PG_BOSS_FACTORY) private readonly createBoss: PgBossFactory,
    private readonly store: OutboxRelayStore,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
    @Inject(RUNTIME_LOGGER) private readonly logger: Logger,
  ) {}

  start(): void {
    if (this.loop) return;
    this.running = true;
    this.loop = this.run();
  }

  async onModuleDestroy(): Promise<void> {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    const wake = this.wake;
    this.wake = undefined;
    wake?.();
    await this.loop;
    if (this.boss) {
      await this.boss.stop({ close: true, graceful: true, timeout: 5000 });
      this.boss = undefined;
    }
  }

  private async run(): Promise<void> {
    while (this.running) {
      try {
        if (await this.ensureQueue()) await this.relayBatch();
      } catch {
        this.logger.error({
          event: 'outbox.relay_failed',
          code: 'OUTBOX_RELAY_OPERATION_FAILED',
        });
      }
      if (this.running) await this.wait();
    }
  }

  private async ensureQueue(): Promise<boolean> {
    if (this.boss) return true;
    const candidate = await this.createBoss();
    candidate.on('error', () => {
      this.logger.error({
        event: 'outbox.queue_error',
        code: 'OUTBOX_QUEUE_OPERATION_FAILED',
      });
    });
    try {
      await candidate.start({ attempts: 1 });
      if (!(await candidate.getQueue(OUTBOX_QUEUE_NAME)))
        throw new Error('OUTBOX_QUEUE_NOT_PROVISIONED');
      this.boss = candidate;
      return true;
    } catch {
      this.logger.error({
        event: 'outbox.queue_unavailable',
        code: 'OUTBOX_QUEUE_START_FAILED',
      });
      try {
        await candidate.stop({ close: true, graceful: false, timeout: 5000 });
      } catch {
        this.logger.warn({
          event: 'outbox.queue_cleanup_failed',
          code: 'OUTBOX_QUEUE_CLEANUP_FAILED',
        });
      }
      return false;
    }
  }

  private async relayBatch(): Promise<void> {
    const leaseOwner = randomUUID();
    const { records, exhausted } = await this.store.claimBatch(
      leaseOwner,
      this.config,
    );
    if (exhausted > 0)
      this.logger.error({
        event: 'outbox.lease_recovery_exhausted',
        count: exhausted,
      });
    await Promise.all(records.map((record) => this.publish(record)));
  }

  private async publish(record: OutboxRecord): Promise<void> {
    try {
      await withCorrelation(record.correlationId, async () => {
        const envelope = this.eventEnvelope(record);
        if (!envelope) {
          const status = await this.store.fail(
            record,
            OUTBOX_EVENT_INVALID,
            this.config,
            true,
          );
          this.logFailure(record, status, OUTBOX_EVENT_INVALID);
          return;
        }

        const delaySeconds = Math.max(
          1,
          Math.ceil(this.config.JOB_RETRY_DELAY_MS / 1000),
        );
        try {
          const boss = this.boss;
          if (!boss) throw new Error('OUTBOX_QUEUE_UNAVAILABLE');
          await boss.send(
            OUTBOX_QUEUE_NAME,
            { eventId: envelope.id },
            {
              id: envelope.id,
              retryLimit: this.config.JOB_RETRY_LIMIT,
              retryDelay: delaySeconds,
              retryBackoff: true,
              retryDelayMax: delaySeconds * (this.config.JOB_RETRY_LIMIT + 1),
            },
          );
        } catch {
          const status = await this.store.fail(
            record,
            OUTBOX_ENQUEUE_FAILED,
            this.config,
            false,
          );
          this.logFailure(record, status, OUTBOX_ENQUEUE_FAILED);
          return;
        }

        try {
          if (!(await this.store.markPublished(record)))
            this.logger.warn({
              event: 'outbox.lease_lost_after_enqueue',
              eventId: record.id,
            });
        } catch {
          this.logger.error({
            event: 'outbox.publish_state_update_failed',
            eventId: record.id,
            code: 'OUTBOX_STATE_UPDATE_FAILED',
          });
        }
      });
    } catch {
      this.logger.error({
        event: 'outbox.publish_failed',
        eventId: record.id,
        code: 'OUTBOX_RELAY_RECORD_FAILED',
      });
    }
  }

  private logFailure(
    record: OutboxRecord,
    status: 'dead' | 'retry' | 'lease_lost',
    code: string,
  ): void {
    if (status === 'lease_lost') {
      this.logger.warn({ event: 'outbox.lease_lost', eventId: record.id });
      return;
    }
    this.logger[status === 'dead' ? 'error' : 'warn']({
      event: status === 'dead' ? 'outbox.event_dead' : 'outbox.enqueue_retry',
      eventId: record.id,
      code,
      attempt: record.attemptCount,
    });
  }

  private eventEnvelope(record: OutboxRecord) {
    try {
      canonicalJson(record.payload);
      const result = EventEnvelopeSchema.safeParse({
        id: record.id,
        type: record.type,
        schemaVersion: record.schemaVersion,
        aggregateType: record.aggregateType,
        aggregateId: record.aggregateId,
        aggregateVersion: record.aggregateVersion,
        payload: record.payload,
        correlationId: record.correlationId,
        occurredAt: record.occurredAt.toISOString(),
      });
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  }

  private wait(): Promise<void> {
    return new Promise((resolve) => {
      this.wake = resolve;
      this.timer = setTimeout(() => {
        this.timer = undefined;
        this.wake = undefined;
        resolve();
      }, this.config.OUTBOX_RELAY_POLL_INTERVAL_MS);
      this.timer.unref();
    });
  }
}
