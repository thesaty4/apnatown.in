import {
  REALTIME_STREAM_EVENTS,
  RealtimeEventSchema,
  type RealtimeEvent,
  type RealtimeSessionData,
} from '@apnatown/shared/realtime';

export const REALTIME_STREAM_URL = '/api/realtime/stream';

export type RealtimeListener = (event: RealtimeEvent) => void;

const MIN_RETRY_MS = 5_000;
const MAX_RETRY_MS = 60_000;

/**
 * One own-account SSE stream (`GET /api/realtime/stream`). Frames are
 * untrusted hints: each is zod-validated and dropped when malformed. The
 * browser retries dropped connections itself; a hard failure (HTTP error,
 * rate limit) is retried here with capped backoff. `expired`/`replaced`
 * session frames end the stream for good.
 */
export class RealtimeConnection {
  private source: EventSource | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | undefined;
  private retryMs = MIN_RETRY_MS;
  private stopped = false;
  private readonly listeners = new Set<RealtimeListener>();

  constructor(
    private readonly onSessionEnded: (
      reason: RealtimeSessionData['reason'],
    ) => void,
  ) {}

  start(): void {
    this.stopped = false;
    this.open();
  }

  stop(): void {
    this.stopped = true;
    clearTimeout(this.retryTimer);
    this.source?.close();
    this.source = null;
  }

  subscribe(listener: RealtimeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private open(): void {
    if (this.stopped || typeof EventSource === 'undefined') return;
    const source = new EventSource(REALTIME_STREAM_URL);
    this.source = source;
    for (const name of REALTIME_STREAM_EVENTS)
      source.addEventListener(name, (frame) =>
        this.receive(name, (frame as MessageEvent<string>).data),
      );
    source.onerror = () => {
      // CONNECTING = the browser is already retrying a dropped stream.
      if (source.readyState === EventSource.CLOSED) this.retryLater(source);
    };
  }

  private receive(name: string, raw: string): void {
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }
    const parsed = RealtimeEventSchema.safeParse({ event: name, data });
    if (!parsed.success) return;
    const event = parsed.data;
    if (event.event === 'ready') this.retryMs = MIN_RETRY_MS;
    if (event.event === 'session' && event.data.reason !== 'shutdown') {
      this.stop();
      this.onSessionEnded(event.data.reason);
      return;
    }
    for (const listener of [...this.listeners]) listener(event);
  }

  private retryLater(source: EventSource): void {
    source.close();
    if (this.stopped || this.source !== source) return;
    this.source = null;
    this.retryTimer = setTimeout(() => this.open(), this.retryMs);
    this.retryMs = Math.min(this.retryMs * 2, MAX_RETRY_MS);
  }
}
