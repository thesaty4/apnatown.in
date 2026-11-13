import { z } from 'zod';
import {
  CountSchema,
  CursorSchema,
  IdSchema,
  TimestampSchema,
  VersionSchema,
} from './wire.js';
import {
  DeliveryFailReasonSchema,
  DeliveryJobStatusSchema,
  RiderJobSchema,
} from './delivery-jobs.js';
import { HandoverCodeSchema } from './delivery-handover.js';

/**
 * Platform rider dispatch (specs/delivery/be/delivery.md "Endpoints",
 * rules 1–5; ST-delivery-job). Dispatch policy (decision D-RD-01, recorded
 * in docs/design-context/11-open-issues-and-assumptions.md): one 60 s offer
 * at a time to the nearest eligible approved/online/idle rider in the job's
 * city; reject/expiry offers the next candidate; none -> `unassigned`.
 * No DTO here carries a customer phone, code or full address.
 */

export const DELIVERY_OFFER_TTL_SECONDS = 60;

export const DELIVERY_ASSIGNMENT_STATES = ['queued', 'offered', 'unassigned', 'assigned'] as const;
export const DeliveryAssignmentStateSchema = z.enum(DELIVERY_ASSIGNMENT_STATES);
export type DeliveryAssignmentState = z.infer<typeof DeliveryAssignmentStateSchema>;

const NameSchema = z.string().min(1).max(60);
const VehicleLabelSchema = z.string().min(1).max(40);
const RatingSchema = z.number().min(0).max(5).nullable();

/** Assigned rider as shown to the order's customer/owner (no phone/location). */
export const DeliveryRiderPublicSchema = z.strictObject({
  displayName: NameSchema,
  vehicleLabel: VehicleLabelSchema.nullable(),
  /** Rider ratings are not published yet (Reviews RV-Q3): always null/0. */
  ratingAverage: RatingSchema,
  ratingCount: CountSchema,
});
export type DeliveryRiderPublic = z.infer<typeof DeliveryRiderPublicSchema>;

/** `OrderDetailDTO.delivery` for platform-rider orders once a job exists. */
export const OrderDeliveryBlockSchema = z.strictObject({
  jobId: IdSchema,
  jobVersion: VersionSchema,
  jobStatus: DeliveryJobStatusSchema,
  assignmentState: DeliveryAssignmentStateSchema,
  /** Only after a rider accepted (assignmentState `assigned`). */
  rider: DeliveryRiderPublicSchema.nullable(),
  /** Live offer countdown (owner/admin views only; null for the customer). */
  offerExpiresAt: TimestampSchema.nullable(),
  failReason: DeliveryFailReasonSchema.nullable(),
});
export type OrderDeliveryBlock = z.infer<typeof OrderDeliveryBlockSchema>;

// Owner dispatch commands ----------------------------------------------------

export const DeliveryRequestSchema = z.strictObject({
  expectedOrderVersion: VersionSchema,
});
export type DeliveryRequest = z.infer<typeof DeliveryRequestSchema>;

/** Directed offer to one candidate (the rider still accepts within 60 s). */
export const DeliveryAssignSchema = z.strictObject({
  riderUserId: IdSchema,
  expectedOrderVersion: VersionSchema,
  /** Omit only when no job exists yet; an existing job needs its version. */
  expectedJobVersion: VersionSchema.optional(),
});
export type DeliveryAssign = z.infer<typeof DeliveryAssignSchema>;

export const DeliveryDispatchStateSchema = z.strictObject({
  orderId: IdSchema,
  orderVersion: VersionSchema,
  delivery: OrderDeliveryBlockSchema,
});
export type DeliveryDispatchState = z.infer<typeof DeliveryDispatchStateSchema>;

export const RIDER_UNAVAILABLE_REASONS = ['busy', 'pending_offer', 'declined'] as const;

/** Picker row; availability is a hint, rechecked on assignment (no reservation). */
export const RiderCandidateSchema = z.strictObject({
  riderUserId: IdSchema,
  displayName: NameSchema,
  vehicleLabel: VehicleLabelSchema.nullable(),
  scope: z.strictObject({ cityId: IdSchema, areaId: IdSchema.nullable() }),
  ratingAverage: RatingSchema,
  ratingCount: CountSchema,
  online: z.boolean(),
  available: z.boolean(),
  unavailableReason: z.enum(RIDER_UNAVAILABLE_REASONS).nullable(),
  /** Straight-line metres from the shop to the rider's latest point. */
  distanceM: z.number().int().nonnegative().nullable(),
});
export type RiderCandidate = z.infer<typeof RiderCandidateSchema>;

export const RiderCandidatePageSchema = z.strictObject({
  jobId: IdSchema.nullable(),
  jobVersion: VersionSchema.nullable(),
  orderVersion: VersionSchema,
  items: z.array(RiderCandidateSchema).max(50),
  /** Always null: the nearest 50 online riders of the job's city. */
  nextCursor: CursorSchema.nullable(),
});
export type RiderCandidatePage = z.infer<typeof RiderCandidatePageSchema>;

// Rider commands ---------------------------------------------------------------

export const DeliveryOfferParamsSchema = z.strictObject({ offerId: IdSchema });
export type DeliveryOfferParams = z.infer<typeof DeliveryOfferParamsSchema>;
export const DeliveryJobParamsSchema = z.strictObject({ jobId: IdSchema });
export type DeliveryJobParams = z.infer<typeof DeliveryJobParamsSchema>;

export const DeliveryOfferRespondSchema = z.strictObject({
  expectedVersion: VersionSchema,
});
export type DeliveryOfferRespond = z.infer<typeof DeliveryOfferRespondSchema>;

export const RIDER_JOB_EVENTS = ['reached_shop', 'picked_up', 'reached_drop', 'fail'] as const;
export const RiderJobEventNameSchema = z.enum(RIDER_JOB_EVENTS);
export type RiderJobEventName = z.infer<typeof RiderJobEventNameSchema>;

export const RiderJobEventInputSchema = z
  .strictObject({
    event: RiderJobEventNameSchema,
    failReason: DeliveryFailReasonSchema.optional(),
    expectedVersion: VersionSchema,
    expectedOrderVersion: VersionSchema,
    expectedFinancialVersion: VersionSchema.optional(),
    /** picked_up: every current fulfillable order item ID (the checklist). */
    checkedItemIds: z.array(IdSchema).max(200).optional(),
  })
  .refine((input) => (input.event === 'fail') === (input.failReason !== undefined), {
    path: ['failReason'],
  })
  .refine((input) => input.event !== 'picked_up' || input.checkedItemIds !== undefined, {
    path: ['checkedItemIds'],
  });
export type RiderJobEventInput = z.infer<typeof RiderJobEventInputSchema>;

/** `job` is null once the job is terminal (no finished-job address). */
export const RiderJobEventResultSchema = z.strictObject({
  jobId: IdSchema,
  jobStatus: DeliveryJobStatusSchema,
  jobVersion: VersionSchema,
  orderId: IdSchema,
  orderVersion: VersionSchema,
  job: RiderJobSchema.nullable(),
});
export type RiderJobEventResult = z.infer<typeof RiderJobEventResultSchema>;

export const RiderJobCompleteSchema = z.strictObject({
  otp: HandoverCodeSchema,
  codeVersion: z.number().int().min(1),
  /** Explicit rider confirmation; required true while cash is outstanding. */
  cashCollected: z.boolean(),
  expectedVersion: VersionSchema,
  expectedOrderVersion: VersionSchema,
  expectedFinancialVersion: VersionSchema.optional(),
});
export type RiderJobComplete = z.infer<typeof RiderJobCompleteSchema>;

// Events (outbox payloads; references only) ---------------------------------------

export const DELIVERY_EVENT_TYPES = Object.freeze({
  jobCreated: 'delivery.job_created',
  offerCreated: 'delivery.offer_created',
  assigned: 'delivery.assigned',
  unassigned: 'delivery.unassigned',
  reachedShop: 'delivery.reached_shop',
  pickedUp: 'delivery.picked_up',
  reachedDrop: 'delivery.reached_drop',
  delivered: 'delivery.delivered',
  failed: 'delivery.failed',
} as const);

export const DeliveryOfferCreatedPayloadSchema = z.strictObject({
  offerId: IdSchema,
  jobId: IdSchema,
  riderUserId: IdSchema,
  expiresAt: TimestampSchema,
});
export type DeliveryOfferCreatedPayload = z.infer<typeof DeliveryOfferCreatedPayloadSchema>;

export const DeliveryJobEventPayloadSchema = z.strictObject({
  orderId: IdSchema,
  jobId: IdSchema,
  scope: z.strictObject({ cityId: IdSchema, areaId: IdSchema }),
  orderVersion: VersionSchema,
  financialVersion: VersionSchema,
  jobVersion: VersionSchema,
  riderUserId: IdSchema.optional(),
  actorUserId: IdSchema.optional(),
  handoverId: IdSchema.optional(),
  reasonKey: z.string().min(1).max(64).optional(),
});
export type DeliveryJobEventPayload = z.infer<typeof DeliveryJobEventPayloadSchema>;
