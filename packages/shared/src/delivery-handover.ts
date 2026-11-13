import { z } from 'zod';
import { CountSchema, IdSchema, PaiseSchema, TimestampSchema, VersionSchema } from './wire.js';

/**
 * Customer handover codes and jobless (self-delivery / pickup) handover
 * commands (specs/delivery/be/delivery.md "Endpoints", BR-05). Plaintext
 * codes appear only in `DeliveryCodeSchema`, served by the dedicated
 * customer no-store channel; every other DTO carries nonsecret metadata.
 */

export const DELIVERY_CODE_KINDS = ['delivery_otp', 'pickup_code'] as const;
export const DeliveryCodeKindSchema = z.enum(DELIVERY_CODE_KINDS);
export type DeliveryCodeKind = z.infer<typeof DeliveryCodeKindSchema>;

export const HANDOVER_STATES = ['not_ready', 'active', 'expired', 'locked', 'consumed'] as const;
export const HandoverStateSchema = z.enum(HANDOVER_STATES);

/** Nonsecret code status (`HandoverMetaDTO`); never a code/hash/ciphertext. */
export const HandoverMetaSchema = z.strictObject({
  kind: DeliveryCodeKindSchema.nullable(),
  codeVersion: z.number().int().min(1).nullable(),
  state: HandoverStateSchema,
  expiresAt: TimestampSchema.nullable(),
  reissueAvailableAt: TimestampSchema.nullable(),
  attemptsRemaining: CountSchema.nullable(),
});
export type HandoverMeta = z.infer<typeof HandoverMetaSchema>;

/** Four digits including leading zeros. */
export const HandoverCodeSchema = z.string().regex(/^\d{4}$/);

export const DeliveryOrderParamsSchema = z.strictObject({ orderId: IdSchema });
export type DeliveryOrderParams = z.infer<typeof DeliveryOrderParamsSchema>;

/** `GET /delivery/orders/{orderId}/code` (order's customer only, no-store). */
export const DeliveryCodeSchema = z.strictObject({
  orderId: IdSchema,
  kind: DeliveryCodeKindSchema,
  code: HandoverCodeSchema,
  codeVersion: z.number().int().min(1),
  expiresAt: TimestampSchema,
  reissueAvailableAt: TimestampSchema,
});
export type DeliveryCode = z.infer<typeof DeliveryCodeSchema>;

export const DeliveryCodeReissueSchema = z.strictObject({
  expectedCodeVersion: z.number().int().min(1),
});
export type DeliveryCodeReissue = z.infer<typeof DeliveryCodeReissueSchema>;

export const SelfDispatchSchema = z.strictObject({
  expectedOrderVersion: VersionSchema,
});
export type SelfDispatch = z.infer<typeof SelfDispatchSchema>;

const handoverFields = {
  code: HandoverCodeSchema,
  codeVersion: z.number().int().min(1),
  /** Explicit owner confirmation; required true when cash is outstanding. */
  cashCollected: z.boolean(),
  expectedOrderVersion: VersionSchema,
  expectedFinancialVersion: VersionSchema.optional(),
};

export const SelfCompleteSchema = z.strictObject(handoverFields);
export type SelfComplete = z.infer<typeof SelfCompleteSchema>;

export const PickupVerifySchema = z.strictObject({
  orderId: IdSchema,
  ...handoverFields,
});
export type PickupVerify = z.infer<typeof PickupVerifySchema>;

export const HandoverPaymentSchema = z.strictObject({
  status: z.enum(['pending', 'paid', 'failed', 'collected', 'refunded']),
  collectedPaise: PaiseSchema.nullable(),
  outstandingPaise: PaiseSchema,
});

/** Self-complete / pickup verify result; never a code or address. */
export const HandoverResultSchema = z.strictObject({
  handoverId: IdSchema,
  orderId: IdSchema,
  orderStatus: z.enum(['delivered', 'picked_up']),
  orderVersion: VersionSchema,
  financialVersion: VersionSchema,
  payment: HandoverPaymentSchema,
  completedAt: TimestampSchema,
});
export type HandoverResult = z.infer<typeof HandoverResultSchema>;

export const SelfDispatchResultSchema = z.strictObject({
  orderId: IdSchema,
  orderStatus: z.literal('out_for_delivery'),
  orderVersion: VersionSchema,
  financialVersion: VersionSchema,
  handover: HandoverMetaSchema,
  dispatchedAt: TimestampSchema,
});
export type SelfDispatchResult = z.infer<typeof SelfDispatchResultSchema>;
