import { Client } from 'pg';
import type { Logger } from 'pino';
import { REALTIME_CHANNEL } from '../realtime/ports';

const MIN_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;

/**
 * One dedicated `LISTEN apnatown_realtime` connection (API process only).
 * Reconnects with bounded exponential backoff + jitter after any error/end.
 * Never logs the connection string or payloads.
 */
export class PgRealtimeListener {
  private client: Client | undefined;
  private timer: NodeJS.Timeout | undefined;
  private attempt = 0;
  private stopped = false;

  constructor(
    private readonly connectionString: string,
    private readonly onPayload: (payload: string) => void,
    private readonly logger: Logger,
  ) {}

  start(): void {
    this.stopped = false;
    void this.connect();
  }

  async stop(): Promise<void> {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    const client = this.client;
    this.client = undefined;
    if (client) await client.end().catch(() => undefined);
  }

  private async connect(): Promise<void> {
    if (this.stopped) return;
    const client = new Client({
      connectionString: this.connectionString,
      connectionTimeoutMillis: 5_000,
      keepAlive: true,
      application_name: 'apnatown-realtime',
    });
    this.client = client;
    let failed = false;
    const fail = () => {
      if (failed) return;
      failed = true;
      if (this.client === client) this.client = undefined;
      void client.end().catch(() => undefined);
      this.schedule();
    };
    client.on('error', () => fail());
    client.on('end', () => fail());
    client.on('notification', (message) => {
      if (message.channel === REALTIME_CHANNEL && message.payload)
        this.onPayload(message.payload);
    });
    try {
      await client.connect();
      await client.query(`LISTEN ${REALTIME_CHANNEL}`);
      if (this.stopped) return void (await client.end().catch(() => undefined));
      this.attempt = 0;
      this.logger.info({ event: 'realtime.listening' });
    } catch {
      this.logger.warn({ event: 'realtime.listen_failed', attempt: this.attempt });
      fail();
    }
  }

  private schedule(): void {
    if (this.stopped || this.timer) return;
    const base = Math.min(MAX_BACKOFF_MS, MIN_BACKOFF_MS * 2 ** this.attempt);
    this.attempt = Math.min(this.attempt + 1, 10);
    const delay = Math.round(base / 2 + Math.random() * (base / 2));
    this.timer = setTimeout(() => {
      this.timer = undefined;
      void this.connect();
    }, delay);
    this.timer.unref();
  }
}
