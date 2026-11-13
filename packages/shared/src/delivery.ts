import { z } from 'zod';
import {
  CountSchema,
  CursorSchema,
  IdSchema,
  LimitSchema,
  PaiseSchema,
  TimestampSchema,
  VersionSchema,
} from './wire.js';
import { RIDER_TIME_ZONE } from './delivery-jobs.js';

/**
 * Delivery rider wire contracts (F-RD-001/002/008, F-AD-002 rider approvals;
 * specs/delivery/be/delivery.md). Phone stays Users' verified identity; no
 * role/status/online field is ever accepted from a client. Payout instruments
 * are write-only: responses carry server-masked strings only.
 */

export const RIDER_STATUSES = [
  'draft',
  'pending',
  'approved',
  'rejected',
  'changes_requested',
  'suspended',
  'inactive',
] as const;
export const RiderStatusSchema = z.enum(RIDER_STATUSES);
export type RiderStatus = z.infer<typeof RiderStatusSchema>;

export const RIDER_VEHICLE_TYPES = ['bike', 'scooter', 'cycle'] as const;
export const RiderVehicleTypeSchema = z.enum(RIDER_VEHICLE_TYPES);
export type RiderVehicleType = z.infer<typeof RiderVehicleTypeSchema>;

export const RIDER_DOCUMENT_KINDS = [
  'selfie',
  'licence',
  'id_proof',
  'rc',
  'other',
] as const;
export const RiderDocumentKindSchema = z.enum(RIDER_DOCUMENT_KINDS);
export type RiderDocumentKind = z.infer<typeof RiderDocumentKindSchema>;

const plain = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine((value) => !/[<>\p{Cc}]/u.test(value), {
      message: 'Plain text without angle brackets or control characters',
    });
// Multi-line text: newlines allowed, other control characters are not.
const prose = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((value) => !/[<>]|[^\P{Cc}\n]/u.test(value), {
      message: 'Text without angle brackets or control characters',
    });

/** UPI virtual payment address (handle@provider). */
export const UpiIdSchema = z
  .string()
  .trim()
  .max(100)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]{1,63}@[A-Za-z][A-Za-z0-9]{1,63}$/);
// TODO(verify): prototype only shows a free "bank" text; digits-only account
// number (9..18) is assumed until the payout policy names IFSC/holder fields.
export const BankAccountSchema = z.string().trim().regex(/^\d{9,18}$/);
export const VehicleNumberSchema = z
  .string()
  .trim()
  .min(4)
  .max(20)
  .regex(/^[A-Za-z0-9][A-Za-z0-9 -]*$/);
/** Optimistic version; 0 addresses the absent first draft. */
export const RiderExpectedVersionSchema = z
  .number()
  .int()
  .min(0)
  .max(2147483647);

/** PUT /delivery/riders/me: draft validates supplied fields only. */
export const RiderDraftWriteSchema = z.strictObject({
  expectedVersion: RiderExpectedVersionSchema,
  step: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  profile: z
    .strictObject({
      fullName: plain(2, 60),
      cityId: IdSchema.optional(),
      areaId: IdSchema.optional(),
    })
    .optional(),
  vehicle: z
    .strictObject({
      type: RiderVehicleTypeSchema,
      number: VehicleNumberSchema.optional(),
    })
    .optional(),
  payout: z
    .strictObject({ upi: UpiIdSchema, bankAccount: BankAccountSchema.optional() })
    .optional(),
  documents: z
    .array(z.strictObject({ kind: RiderDocumentKindSchema, assetId: IdSchema }))
    .max(10)
    .optional(),
  submit: z.boolean().optional(),
});
export type RiderDraftWrite = z.infer<typeof RiderDraftWriteSchema>;

export const RiderCapabilitiesSchema = z.strictObject({
  canEdit: z.boolean(),
  canSubmit: z.boolean(),
  canGoOnline: z.boolean(),
  canWork: z.boolean(),
});
export const RiderRequirementsSchema = z.strictObject({
  /** `unavailable` until the typed KYC document policy (Q-05) is configured. */
  availability: z.enum(['available', 'unavailable']),
  version: z.string().min(1).max(64).optional(),
  requiredFields: z.array(z.string().regex(/^[a-z][A-Za-z.]*$/)).max(20),
  requiredDocumentKinds: z.array(RiderDocumentKindSchema).max(5),
});
export const RiderProfileSchema = z.strictObject({
  /** 0 for the empty first draft (no stored application yet). */
  version: RiderExpectedVersionSchema,
  status: RiderStatusSchema,
  reason: z.string().max(500).optional(),
  profile: z.strictObject({
    fullName: z.string().nullable(),
    cityId: IdSchema.nullable(),
    areaId: IdSchema.nullable(),
    cityName: z.string().optional(),
    areaName: z.string().optional(),
  }),
  vehicle: z
    .strictObject({
      type: RiderVehicleTypeSchema,
      number: z.string().nullable(),
    })
    .optional(),
  payoutMasked: z
    .strictObject({
      upi: z.string().max(40).optional(),
      bank: z.string().max(40).optional(),
    })
    .optional(),
  documents: z.array(
    z.strictObject({
      kind: RiderDocumentKindSchema,
      assetId: IdSchema,
      uploadedAt: TimestampSchema,
    }),
  ),
  requirements: RiderRequirementsSchema,
  capabilities: RiderCapabilitiesSchema,
});
export type RiderProfile = z.infer<typeof RiderProfileSchema>;

export const RiderOnlineInputSchema = z.strictObject({ online: z.boolean() });
export type RiderOnlineInput = z.infer<typeof RiderOnlineInputSchema>;
export const RiderOnlineStateSchema = z.strictObject({
  online: z.boolean(),
  approvalStatus: RiderStatusSchema,
  asOf: TimestampSchema,
});
export type RiderOnlineState = z.infer<typeof RiderOnlineStateSchema>;

export const RiderLocationInputSchema = z.strictObject({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type RiderLocationInput = z.infer<typeof RiderLocationInputSchema>;

/** Rolling 24 h [asOf-24h, asOf); IST is display-only. */
export const RiderSummarySchema = z.strictObject({
  asOf: TimestampSchema,
  periodStart: TimestampSchema,
  periodEnd: TimestampSchema,
  timeZone: z.literal(RIDER_TIME_ZONE),
  completedCount: CountSchema,
  totalPaise: PaiseSchema,
  online: z.boolean(),
  approvalStatus: RiderStatusSchema,
  activeJobId: IdSchema.optional(),
});
export type RiderSummary = z.infer<typeof RiderSummarySchema>;

// TODO(verify): the prototype dispute form is free text only; these coarse
// routing keys are provisional until product names the reason list.
export const RIDER_DISPUTE_REASONS = [
  'account',
  'payout',
  'delivery',
  'other',
] as const;
export const RiderDisputeReasonSchema = z.enum(RIDER_DISPUTE_REASONS);
export const RiderDisputeInputSchema = z.strictObject({
  jobId: IdSchema.optional(),
  reasonKey: RiderDisputeReasonSchema,
  // 960 leaves room for the reason prefix within Settings' 1000-char message.
  details: prose(960),
});
export type RiderDisputeInput = z.infer<typeof RiderDisputeInputSchema>;
export const RiderDisputeResultSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('support'), supportMessageId: IdSchema }),
]);
export type RiderDisputeResult = z.infer<typeof RiderDisputeResultSchema>;

// ---------------------------------------------------------------------------
// Admin approvals (F-AD-002): scoped queue cards, never KYC/phone/payout.
// ---------------------------------------------------------------------------

export const RIDER_DECISION_ACTIONS = [
  'approve',
  'reject',
  'request_changes',
  'suspend',
  'restore',
] as const;
export const RiderDecisionActionSchema = z.enum(RIDER_DECISION_ACTIONS);
export type RiderDecisionAction = z.infer<typeof RiderDecisionActionSchema>;

export const RIDER_APPLICATION_STATUSES = [
  'pending',
  'changes_requested',
  'rejected',
  'approved',
  'suspended',
  'inactive',
] as const;
export const RiderApplicationQuerySchema = z.strictObject({
  status: z.enum(RIDER_APPLICATION_STATUSES).default('pending'),
  cursor: CursorSchema.optional(),
  limit: z.preprocess(
    (value) =>
      typeof value === 'string' && /^[1-9]\d{0,2}$/.test(value)
        ? Number(value)
        : value,
    LimitSchema,
  ),
});
export type RiderApplicationQuery = z.infer<typeof RiderApplicationQuerySchema>;
export const RiderApplicationCardSchema = z.strictObject({
  userId: IdSchema,
  fullName: z.string().nullable(),
  status: RiderStatusSchema,
  cityId: IdSchema.nullable(),
  areaId: IdSchema.nullable(),
  vehicleType: RiderVehicleTypeSchema.nullable(),
  submittedAt: TimestampSchema.nullable(),
  createdAt: TimestampSchema,
  version: VersionSchema,
  allowedActions: z.array(RiderDecisionActionSchema),
});
export type RiderApplicationCard = z.infer<typeof RiderApplicationCardSchema>;
export const RiderApplicationPageSchema = z.strictObject({
  items: z.array(RiderApplicationCardSchema).max(50),
  nextCursor: CursorSchema.nullable(),
});
export type RiderApplicationPage = z.infer<typeof RiderApplicationPageSchema>;
export const RiderUserParamsSchema = z.strictObject({ userId: IdSchema });

export const RiderDecisionSchema = z
  .strictObject({
    action: RiderDecisionActionSchema,
    reason: plain(1, 500).optional(),
    expectedVersion: VersionSchema,
  })
  .refine(
    (input) =>
      !['reject', 'request_changes'].includes(input.action) || !!input.reason,
    { path: ['reason'], message: 'Reason required' },
  );
export type RiderDecision = z.infer<typeof RiderDecisionSchema>;
export const RiderDecisionResultSchema = z.strictObject({
  userId: IdSchema,
  status: RiderStatusSchema,
  previousStatus: RiderStatusSchema,
  version: VersionSchema,
  decidedAt: TimestampSchema,
});
export type RiderDecisionResult = z.infer<typeof RiderDecisionResultSchema>;

// ---------------------------------------------------------------------------
// Outbox events (no phone, payout, KYC or free-text reason).
// ---------------------------------------------------------------------------

export const RIDER_EVENT_TYPES = Object.freeze({
  applicationSubmitted: 'rider.application_submitted',
  applicationDecided: 'rider.application_decided',
} as const);
const RiderScopeSchema = z.strictObject({
  cityId: IdSchema.nullable(),
  areaId: IdSchema.nullable(),
});
export const RiderApplicationSubmittedPayloadSchema = z.strictObject({
  riderUserId: IdSchema,
  applicationVersion: VersionSchema,
  scope: RiderScopeSchema,
});
export const RiderApplicationDecidedPayloadSchema =
  RiderApplicationSubmittedPayloadSchema.extend({
    status: RiderStatusSchema,
    previousStatus: RiderStatusSchema,
    decisionId: IdSchema,
  });
export type RiderApplicationDecidedPayload = z.infer<
  typeof RiderApplicationDecidedPayloadSchema
>;

export * from './delivery-jobs.js';
export * from './delivery-handover.js';
export * from './delivery-dispatch.js';
