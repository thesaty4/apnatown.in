import {
  Inject,
  Injectable,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import {
  RealtimeSignalPayloadSchema,
  type RealtimeSessionData,
  type RealtimeSignalPayload,
} from '@apnatown/shared/realtime';
import type { Logger } from 'pino';
import { RUNTIME_CONFIG, type RuntimeConfig } from '../config/config';
import { RUNTIME_LOGGER } from '../logger/logger';
import { PgRealtimeListener } from '../persistence/realtime-listener';

/** Max concurrent streams per user; the oldest is closed on overflow. */
export const MAX_STREAMS_PER_USER = 5;
const MAX_PAYLOAD_BYTES = 8_000;

/** One open browser stream owned by `userId`. */
export interface RealtimeSubscriber {
  readonly userId: string;
  deliver(signal: RealtimeSignalPayload): void;
  close(reason: RealtimeSessionData['reason']): void;
}

/**
 * API-only fan-out: one PostgreSQL LISTEN connection, in-memory subscribers
 * keyed by user. Payloads are untrusted until zod-validated; invalid ones
 * are dropped (counted in logs, never echoed). Never registered in the worker.
 */
@Injectable()
export class RealtimeHub implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly byUser = new Map<string, RealtimeSubscriber[]>();
  private readonly listener: PgRealtimeListener;

  constructor(
    @Inject(RUNTIME_CONFIG) config: RuntimeConfig,
    @Inject(RUNTIME_LOGGER) private readonly logger: Logger,
  ) {
    this.listener = new PgRealtimeListener(
      config.DATABASE_URL,
      (payload) => this.dispatch(payload),
      logger,
    );
  }

  onApplicationBootstrap(): void {
    this.listener.start();
  }

  async onApplicationShutdown(): Promise<void> {
    this.closeAll();
    await this.listener.stop();
  }

  /** Registers a stream; returns its unsubscribe function. */
  subscribe(subscriber: RealtimeSubscriber): () => void {
    const list = this.byUser.get(subscriber.userId) ?? [];
    list.push(subscriber);
    this.byUser.set(subscriber.userId, list);
    while (list.length > MAX_STREAMS_PER_USER) list.shift()?.close('replaced');
    return () => this.remove(subscriber);
  }

  /** Ends every open stream (graceful shutdown before the HTTP server drains). */
  closeAll(): void {
    for (const list of [...this.byUser.values()])
      for (const subscriber of [...list]) subscriber.close('shutdown');
    this.byUser.clear();
  }

  private remove(subscriber: RealtimeSubscriber): void {
    const list = this.byUser.get(subscriber.userId);
    if (!list) return;
    const index = list.indexOf(subscriber);
    if (index >= 0) list.splice(index, 1);
    if (!list.length) this.byUser.delete(subscriber.userId);
  }

  private dispatch(raw: string): void {
    if (raw.length > MAX_PAYLOAD_BYTES) return this.dropped();
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return this.dropped();
    }
    const parsed = RealtimeSignalPayloadSchema.safeParse(json);
    if (!parsed.success) return this.dropped();
    for (const userId of parsed.data.userIds)
      for (const subscriber of [...(this.byUser.get(userId) ?? [])])
        subscriber.deliver(parsed.data);
  }

  private dropped(): void {
    this.logger.warn({ event: 'realtime.payload_dropped' });
  }
}
