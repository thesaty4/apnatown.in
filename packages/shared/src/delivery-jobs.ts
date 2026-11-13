import { z } from 'zod';
import {
  CountSchema,
  CursorSchema,
  IdSchema,
  LimitSchema,
  PaiseSchema,
  SignedPaiseSchema,
  TimestampSchema,
  VersionSchema,
} from './wire.js';

/**
 * Delivery job-side wire contracts (F-RD-003..006): offers, the assigned
 * job, terminal history and earnings read persisted `delivery_jobs` /
 * `delivery_offers` rows. Payout stays explicitly unavailable. Money is
 * safe-integer paise; timestamps ISO UTC.
 */

/** Reporting display zone for rider periods (bounds stay UTC instants). */
export const RIDER_TIME_ZONE = 'Asia/Kolkata' as const;

export const DELIVERY_JOB_STATUSES = [
  'requested',
  'accepted',
  'reached_shop',
  'picked_up',
  'reached_drop',
  'delivered',
  'failed',
  'cancelled',
] as const;
export const DeliveryJobStatusSchema = z.enum(DELIVERY_JOB_STATUSES);
export type DeliveryJobStatus = z.infer<typeof DeliveryJobStatusSchema>;

export const DELIVERY_FAIL_REASONS = [
  'customer_unreachable',
  'wrong_address',
  'customer_cancelled',
  'vehicle_problem',
] as const;
export const DeliveryFailReasonSchema = z.enum(DELIVERY_FAIL_REASONS);

const DistanceSchema = z.number().int().safe().nonnegative();
const LabelSchema = z.string().min(1).max(120);
/** Area/first-name labels may be empty when the snapshot has none (never invented). */
const OptionalLabelSchema = z.string().max(120);

export const DeliveryEstimateSchema = z.strictObject({
  basePaise: PaiseSchema,
  perKmPaise: PaiseSchema,
  totalPaise: PaiseSchema,
  settingsVersion: z.string().min(1).max(64),
  estimatedAt: TimestampSchema,
});
export const DeliveryEarnedSchema = z.strictObject({
  basePaise: PaiseSchema,
  perKmPaise: PaiseSchema,
  distanceM: DistanceSchema,
  distancePayPaise: PaiseSchema,
  roundingPaise: SignedPaiseSchema,
  totalPaise: PaiseSchema,
  settingsVersion: z.string().min(1).max(64),
  earnedAt: TimestampSchema,
});

/** Pending offer; no full customer address before acceptance. */
export const RiderOfferSchema = z.strictObject({
  offerId: IdSchema,
  version: VersionSchema,
  jobId: IdSchema,
  pickup: z.strictObject({ businessName: LabelSchema, area: OptionalLabelSchema }),
  dropArea: OptionalLabelSchema,
  distanceM: DistanceSchema,
  itemCount: CountSchema,
  estimate: DeliveryEstimateSchema,
  expiresAt: TimestampSchema,
  serverTime: TimestampSchema,
});
export type RiderOffer = z.infer<typeof RiderOfferSchema>;
/** `offer: null` is the explicit "no current offer" state. */
export const RiderCurrentOfferSchema = z.strictObject({
  offer: RiderOfferSchema.nullable(),
});
export type RiderCurrentOffer = z.infer<typeof RiderCurrentOfferSchema>;

const PointSchema = z.strictObject({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/** Currently assigned job; no plaintext code or raw phone. */
export const RiderJobSchema = z.strictObject({
  jobId: IdSchema,
  orderId: IdSchema,
  orderNumber: z.string().min(1).max(32),
  version: VersionSchema,
  orderVersion: VersionSchema,
  financialVersion: VersionSchema,
  status: DeliveryJobStatusSchema,
  allowedActions: z.array(
    z.enum(['reached_shop', 'picked_up', 'reached_drop', 'fail', 'complete']),
  ),
  pickup: z.strictObject({ businessName: LabelSchema, area: OptionalLabelSchema }),
  drop: z.strictObject({
    firstName: OptionalLabelSchema,
    address: z.string().min(1).max(500),
    location: PointSchema.nullable(),
  }),
  items: z.array(
    z.strictObject({
      orderItemId: IdSchema,
      name: LabelSchema,
      variantLabel: LabelSchema.optional(),
      quantity: z.number().int().min(1),
      availability: z.enum(['available', 'unavailable']),
    }),
  ),
  itemCount: CountSchema,
  distanceM: DistanceSchema,
  estimate: DeliveryEstimateSchema,
  earned: DeliveryEarnedSchema.optional(),
  payment: z.strictObject({
    method: z.enum(['cod', 'prepaid', 'no_charge']),
    currentPayablePaise: PaiseSchema,
    outstandingPaise: PaiseSchema,
    status: z.string().min(1).max(40),
  }),
  handover: z.strictObject({
    kind: z.enum(['delivery_otp', 'pickup_code']).optional(),
    codeVersion: z.number().int().min(1).optional(),
    state: z.enum(['not_ready', 'active', 'expired', 'locked', 'consumed']),
    expiresAt: TimestampSchema.optional(),
    reissueAvailableAt: TimestampSchema.optional(),
    attemptsRemaining: CountSchema.optional(),
  }),
  call: z.strictObject({
    available: z.boolean(),
    maskedLabel: LabelSchema.optional(),
  }),
});
export type RiderJob = z.infer<typeof RiderJobSchema>;

/** Terminal assigned-job history row; no live location/address/call handle. */
export const RiderHistorySchema = z.strictObject({
  jobId: IdSchema,
  orderId: IdSchema,
  orderNumber: z.string().min(1).max(32),
  shopName: LabelSchema,
  dropArea: OptionalLabelSchema,
  status: z.enum(['delivered', 'failed', 'cancelled']),
  reasonKey: DeliveryFailReasonSchema.optional(),
  distanceM: DistanceSchema,
  timestamps: z.strictObject({
    acceptedAt: TimestampSchema.nullable(),
    deliveredAt: TimestampSchema.nullable(),
    failedAt: TimestampSchema.nullable(),
    cancelledAt: TimestampSchema.nullable(),
  }),
  estimate: DeliveryEstimateSchema,
  earned: DeliveryEarnedSchema.optional(),
});
export type RiderHistory = z.infer<typeof RiderHistorySchema>;

const limit = z.preprocess(
  (value) =>
    typeof value === 'string' && /^[1-9]\d{0,2}$/.test(value)
      ? Number(value)
      : value,
  LimitSchema,
);

/** Rolling periods (prototype js10.js): today=[asOf-24h,asOf), week=7x24h. */
export const RiderHistoryQuerySchema = z.strictObject({
  range: z.enum(['all', 'today', 'week']).default('all'),
  cursor: CursorSchema.optional(),
  limit,
});
export type RiderHistoryQuery = z.infer<typeof RiderHistoryQuerySchema>;
export const RiderHistoryPageSchema = z.strictObject({
  items: z.array(RiderHistorySchema).max(50),
  nextCursor: CursorSchema.nullable(),
  /** Null for `range=all`; otherwise the pinned half-open UTC bound. */
  periodStart: TimestampSchema.nullable(),
  periodEnd: TimestampSchema,
  asOf: TimestampSchema,
});
export type RiderHistoryPage = z.infer<typeof RiderHistoryPageSchema>;
export const RiderJobParamsSchema = z.strictObject({ jobId: IdSchema });

export const RiderEarningsQuerySchema = z.strictObject({
  range: z.enum(['day', 'week']).default('day'),
});
export type RiderEarningsQuery = z.infer<typeof RiderEarningsQuerySchema>;
export const RiderEarningsSchema = z.strictObject({
  asOf: TimestampSchema,
  periodStart: TimestampSchema,
  periodEnd: TimestampSchema,
  timeZone: z.literal(RIDER_TIME_ZONE),
  completedCount: CountSchema,
  totalPaise: PaiseSchema,
  rides: z.array(RiderHistorySchema).max(50),
  nextCursor: CursorSchema.nullable(),
  /** No settlement writer exists: payout stays unavailable, never "paid"/zero. */
  payout: z.strictObject({
    availability: z.enum(['unavailable', 'available']),
    pendingPaise: PaiseSchema.nullable(),
    // TODO(verify): item shape awaits the settlement owner/evidence decision;
    // always empty until then.
    items: z.array(
      z.strictObject({ periodEnd: TimestampSchema, amountPaise: PaiseSchema }),
    ),
  }),
});
export type RiderEarnings = z.infer<typeof RiderEarningsSchema>;
