import { Controller, Get, Req, Res } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { OwnAccount, sessionBinding, type AuthRequest } from '../auth';
import { PrivateApi } from '../auth/openapi';
import { DomainError } from '../errors/errors';
import { RateLimit } from '../rate-limit/rate-limit';
import { RealtimeStreamService } from './realtime-stream.service';

const CONNECT_LIMIT = {
  key: 'realtime.stream.connect',
  maximumHits: 30,
  windowSeconds: 60,
  subject: 'principal',
} as const;

const DESCRIPTION = [
  'Own-account Server-Sent Events stream of invalidation hints (no PII, codes, amounts or text).',
  'Frames: `event: ready` data `{}` once subscribed; `event: order` data `{"orderId":"<uuid>"}` when an order the caller is customer or business owner of changes (placed, accepted, preparing, ready, out for delivery, delivered, picked up, cancelled/rejected, code reissued);',
  '`event: notification` data `{}` when new in-app notifications were published for the caller;',
  '`event: session` data `{"reason":"expired"|"replaced"|"shutdown"}` immediately before the server closes the stream.',
  'A `: heartbeat` comment is sent every 25s; `retry: 5000` advises reconnect delay. The session is revalidated every 60s.',
  'At most 5 concurrent streams per user (the oldest is closed with reason `replaced`). Delivery is best-effort: refetch REST state on `ready`, on each hint and after reconnect.',
  'private, no-store, no-transform; X-Accel-Buffering: no.',
].join(' ');

@ApiTags('realtime')
@PrivateApi()
@OwnAccount()
@Controller('realtime')
export class RealtimeController {
  constructor(private readonly streams: RealtimeStreamService) {}

  @Get('stream')
  @ApiProduces('text/event-stream')
  @ApiOperation({
    operationId: 'realtimeStream',
    summary: 'Own real-time order/notification hints (SSE)',
    description: DESCRIPTION,
  })
  @ApiOkResponse({
    description: 'text/event-stream; frames as described above.',
    content: { 'text/event-stream': { schema: { type: 'string' } } },
  })
  @RateLimit(CONNECT_LIMIT)
  stream(@Req() request: AuthRequest, @Res() response: Response): void {
    if (!request.principal) throw new DomainError('SESSION_EXPIRED');
    this.streams.open(
      { session: sessionBinding(request), userId: request.principal.userId },
      request,
      response,
    );
  }
}
