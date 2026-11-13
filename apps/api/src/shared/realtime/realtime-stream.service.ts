import { Inject, Injectable } from '@nestjs/common';
import {
  REALTIME_HEARTBEAT_MS,
  type RealtimeSessionData,
  type RealtimeSignalPayload,
} from '@apnatown/shared/realtime';
import type { Request, Response } from 'express';
import type { Logger } from 'pino';
import { SESSION_ACCESS, type SessionAccess, type SessionBinding } from '../auth/ports';
import { DomainError } from '../errors/errors';
import { RUNTIME_LOGGER } from '../logger/logger';
import { UNIT_OF_WORK, type UnitOfWork } from '../persistence/ports';
import { RealtimeHub, type RealtimeSubscriber } from './realtime-hub';

const REVALIDATE_MS = 60_000;
/** A client that stops reading is dropped rather than buffered without bound. */
const MAX_BUFFERED_BYTES = 64 * 1024;
const RETRY_MS = 5_000;

export interface StreamOwner {
  readonly session: SessionBinding;
  readonly userId: string;
}

/**
 * SSE stream lifecycle: headers, ready/heartbeat frames, hub subscription,
 * periodic session revalidation (`event: session` then close on failure),
 * slow-consumer protection and cleanup on disconnect.
 */
@Injectable()
export class RealtimeStreamService {
  constructor(
    private readonly hub: RealtimeHub,
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(RUNTIME_LOGGER) private readonly logger: Logger,
  ) {}

  open(owner: StreamOwner, request: Request, response: Response): void {
    response.status(200);
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    // no-transform keeps any proxy/compression layer from buffering frames.
    response.setHeader('Cache-Control', 'private, no-store, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no');
    request.socket.setTimeout(0);
    request.socket.setNoDelay(true);
    request.socket.setKeepAlive(true);
    response.flushHeaders();

    let closed = false;
    const timers: NodeJS.Timeout[] = [];
    const write = (chunk: string) => {
      if (closed) return;
      response.write(chunk);
      if (response.writableLength > MAX_BUFFERED_BYTES) end();
    };
    const frame = (event: string, data: object) =>
      write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    const end = (reason?: RealtimeSessionData['reason']) => {
      if (closed) return;
      if (reason) frame('session', { reason });
      closed = true;
      timers.forEach(clearInterval);
      unsubscribe();
      response.end();
    };
    const subscriber: RealtimeSubscriber = {
      userId: owner.userId,
      deliver: (signal) => this.deliver(signal, frame),
      close: (reason) => end(reason),
    };
    const unsubscribe = this.hub.subscribe(subscriber);
    request.on('close', () => end());
    write(`retry: ${RETRY_MS}\n\n`);
    frame('ready', {});
    timers.push(
      setInterval(() => write(': heartbeat\n\n'), REALTIME_HEARTBEAT_MS),
      setInterval(() => {
        void this.stillValid(owner).then((valid) => {
          if (!valid) end('expired');
        });
      }, REVALIDATE_MS),
    );
    timers.forEach((timer) => timer.unref());
  }

  private deliver(
    signal: RealtimeSignalPayload,
    frame: (event: string, data: object) => void,
  ): void {
    if (signal.kind === 'order' && signal.orderId)
      frame('order', { orderId: signal.orderId });
    else if (signal.kind === 'notification') frame('notification', {});
  }

  /** Locks + revalidates the session and live identity (revocation, expiry, account status). */
  private async stillValid(owner: StreamOwner): Promise<boolean> {
    try {
      const principal = await this.uow.run((tx) =>
        this.sessions.requirePrincipal(tx, owner.session),
      );
      return principal.userId === owner.userId;
    } catch (error) {
      // Transient infrastructure errors keep the stream; the next check retries.
      if (!(error instanceof DomainError)) return true;
      this.logger.info({ event: 'realtime.session_ended', code: error.code });
      return false;
    }
  }
}
