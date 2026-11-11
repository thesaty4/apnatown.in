import { z } from 'zod';

export const PaiseSchema = z.number().int().safe().nonnegative();
export const SignedPaiseSchema = z.number().int().safe();
export const IdSchema = z.uuid();
export const VersionSchema = z.number().int().min(1).max(2147483647);
export const TimestampSchema = z.iso.datetime({ offset: false });
export const CountSchema = z.number().int().safe().nonnegative();
export const LimitSchema = z.number().int().min(1).max(50).default(20);
// Shape only. Authentication and endpoint/scope binding belong to C01's server helper.
export const CursorSchema = z
  .string()
  .min(1)
  .max(2048)
  .regex(/^[A-Za-z0-9_-]+$/);
export const CorrelationIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/);
export const EmptyRequestSchema = z.strictObject({});
export const HealthResponseSchema = z.strictObject({ status: z.literal('ok') });
export const ErrorResponseSchema = z.strictObject({
  code: z.string().regex(/^[A-Z][A-Z0-9_]+$/),
  message_key: z.string().regex(/^errors\.[A-Za-z0-9.]+$/),
  status: z.number().int().min(400).max(599),
  details: z.strictObject({
    fields: z.array(z.string().max(100)).max(50).optional(),
  }),
  correlationId: CorrelationIdSchema,
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
