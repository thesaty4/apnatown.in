import { z } from 'zod';
import {
  CorrelationIdSchema,
  IdSchema,
  TimestampSchema,
  VersionSchema,
} from './wire.js';

export const EventEnvelopeSchema = z.strictObject({
  id: IdSchema,
  type: z
    .string()
    .max(128)
    .regex(/^[a-z][a-z0-9_-]*(?:\.[a-z][a-z0-9_-]*)+$/),
  schemaVersion: VersionSchema,
  aggregateType: z
    .string()
    .max(64)
    .regex(/^[a-z][a-z0-9_-]*$/),
  aggregateId: IdSchema,
  aggregateVersion: VersionSchema,
  payload: z.json(),
  correlationId: CorrelationIdSchema,
  occurredAt: TimestampSchema,
});

export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;
