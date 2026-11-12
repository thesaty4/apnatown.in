import { z } from 'zod';
import {
  CorrelationIdSchema,
  IdSchema,
  TimestampSchema,
  VersionSchema,
} from './wire.js';
import { ConsentChannelSchema, ConsentPurposeSchema } from './users.js';

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

// Users consent evidence (BR-11). Published only on an effective change.
export const CONSENT_EVENT_TYPES = Object.freeze({
  granted: 'consent.granted',
  withdrawn: 'consent.withdrawn',
} as const);
export const ConsentEventTypeSchema = z.enum([
  CONSENT_EVENT_TYPES.granted,
  CONSENT_EVENT_TYPES.withdrawn,
]);
export const ConsentEventPayloadSchema = z
  .strictObject({
    userId: IdSchema.optional(),
    anonymousSubjectId: IdSchema.optional(),
    purpose: ConsentPurposeSchema,
    channel: ConsentChannelSchema,
    consentId: IdSchema,
    recordedAt: TimestampSchema,
  })
  .refine(
    (value) =>
      (value.userId === undefined) !== (value.anonymousSubjectId === undefined),
  );
export type ConsentEventType = z.infer<typeof ConsentEventTypeSchema>;
export type ConsentEventPayload = z.infer<typeof ConsentEventPayloadSchema>;
