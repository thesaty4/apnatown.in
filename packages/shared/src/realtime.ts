import { z } from 'zod';
import { IdSchema } from './wire.js';

// ---------------------------------------------------------------------------
// Real-time invalidation signals (orders BE "Event contracts", notifications
// BE F-NT-001). Signals carry references only — never PII, codes, amounts or
// rendered text. Clients refetch the owning REST resource on receipt.
// ---------------------------------------------------------------------------

export const REALTIME_SIGNAL_KINDS = ['order', 'notification'] as const;
export const RealtimeSignalKindSchema = z.enum(REALTIME_SIGNAL_KINDS);
export type RealtimeSignalKind = z.infer<typeof RealtimeSignalKindSchema>;

/** Max recipients per PostgreSQL NOTIFY payload (keeps it well under 8000 bytes). */
export const REALTIME_MAX_RECIPIENTS = 150;

/**
 * Internal cross-process payload on the `apnatown_realtime` channel
 * (worker/API → API hub). Not a browser contract.
 */
export const RealtimeSignalPayloadSchema = z.strictObject({
  v: z.literal(1),
  kind: RealtimeSignalKindSchema,
  userIds: z.array(IdSchema).min(1).max(REALTIME_MAX_RECIPIENTS),
  orderId: IdSchema.optional(),
});
export type RealtimeSignalPayload = z.infer<typeof RealtimeSignalPayloadSchema>;

// Browser SSE contract: GET /api/realtime/stream (text/event-stream). -------

export const REALTIME_STREAM_EVENTS = ['ready', 'order', 'notification', 'session'] as const;
export const RealtimeStreamEventNameSchema = z.enum(REALTIME_STREAM_EVENTS);
export type RealtimeStreamEventName = z.infer<typeof RealtimeStreamEventNameSchema>;

/** `event: ready` — stream subscribed; refetch once to close any gap. */
export const RealtimeReadyDataSchema = z.strictObject({});
/** `event: order` — this order changed; refetch its detail/lists/counts. */
export const RealtimeOrderDataSchema = z.strictObject({ orderId: IdSchema });
export type RealtimeOrderData = z.infer<typeof RealtimeOrderDataSchema>;
/** `event: notification` — new in-app item(s); refetch feed/unread count. */
export const RealtimeNotificationDataSchema = z.strictObject({});
/** `event: session` — session no longer valid or stream replaced; stream closes next. */
export const RealtimeSessionDataSchema = z.strictObject({
  reason: z.enum(['expired', 'replaced', 'shutdown']),
});
export type RealtimeSessionData = z.infer<typeof RealtimeSessionDataSchema>;

/** Parsed SSE frame (`event` name + JSON `data`) as a discriminated union. */
export const RealtimeEventSchema = z.discriminatedUnion('event', [
  z.strictObject({ event: z.literal('ready'), data: RealtimeReadyDataSchema }),
  z.strictObject({ event: z.literal('order'), data: RealtimeOrderDataSchema }),
  z.strictObject({ event: z.literal('notification'), data: RealtimeNotificationDataSchema }),
  z.strictObject({ event: z.literal('session'), data: RealtimeSessionDataSchema }),
]);
export type RealtimeEvent = z.infer<typeof RealtimeEventSchema>;

/** Server heartbeat comment interval; clients may treat 2× silence as a drop. */
export const REALTIME_HEARTBEAT_MS = 25_000;
