import { z } from 'zod';

export const PaiseSchema = z.number().int().safe().nonnegative();
export const SignedPaiseSchema = z.number().int().safe();
// Any 8-4-4-4-12 hex id, matching PostgreSQL `uuid`. Not `z.uuid()`: its RFC
// version/variant check rejects deterministic `md5(...)::uuid` seed ids.
export const IdSchema = z.guid();
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
export const PageQuerySchema = z.strictObject({
  cursor: CursorSchema.optional(),
  limit: z.preprocess(
    (value) =>
      typeof value === 'string' && /^[1-9]\d{0,2}$/.test(value)
        ? Number(value)
        : value,
    LimitSchema,
  ),
});
export type PageQuery = z.infer<typeof PageQuerySchema>;
export const CorrelationIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/);
export const EmptyRequestSchema = z.strictObject({});
export const HealthResponseSchema = z.strictObject({ status: z.literal('ok') });
const fieldPath = z
  .string()
  .max(100)
  .regex(/^[A-Za-z][A-Za-z0-9_.]*$/);
const machineCode = z.string().regex(/^[a-z][a-z0-9_]{0,39}$/);
/**
 * Allow-listed, value-free details. `rows`/`totalErrors` carry row-numbered
 * validation codes (1-based data rows; never cell values); `expected`/
 * `unknown` carry template header names, `unknown` only for submitted names
 * that are safe field-path tokens.
 */
export const ErrorDetailsSchema = z.strictObject({
  field: fieldPath.optional(),
  fields: z.array(fieldPath).max(50).optional(),
  rows: z
    .array(
      z.strictObject({
        row: z.number().int().min(1).max(1_048_576),
        field: fieldPath.nullable(),
        code: machineCode,
      }),
    )
    .max(100)
    .optional(),
  totalErrors: z.number().int().min(0).max(1_000_000).optional(),
  expected: z.array(fieldPath).max(50).optional(),
  unknown: z.array(fieldPath).max(50).optional(),
});
export type ErrorDetails = z.infer<typeof ErrorDetailsSchema>;
export const ErrorResponseSchema = z.strictObject({
  code: z.string().regex(/^[A-Z][A-Z0-9_]+$/),
  message_key: z.string().regex(/^errors\.[A-Za-z0-9.]+$/),
  status: z.number().int().min(400).max(599),
  details: ErrorDetailsSchema,
  correlationId: CorrelationIdSchema,
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
