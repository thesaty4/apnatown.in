import { z } from 'zod';
import {
  CountSchema,
  CursorSchema,
  IdSchema,
  PaiseSchema,
  TimestampSchema,
  VersionSchema,
} from './wire.js';

// Owner offers (S-VEND-07, F-VD-007, F-OF-005; specs/offers/be/offers.md).
// Business-wide offers only in this slice: product targets, banner upload,
// featured requests and coupons are not authored here yet.

export const OFFER_STATUSES = ['pending', 'active', 'paused', 'ended'] as const;
export const OfferStatusSchema = z.enum(OFFER_STATUSES);
export type OfferStatus = z.infer<typeof OfferStatusSchema>;
export const OFFER_DISCOUNT_TYPES = ['percent', 'flat', 'free_delivery'] as const;
export const OfferDiscountTypeSchema = z.enum(OFFER_DISCOUNT_TYPES);
export type OfferDiscountType = z.infer<typeof OfferDiscountTypeSchema>;

export const OwnerOfferQuerySchema = z.strictObject({
  status: z.enum(['all', ...OFFER_STATUSES]).default('all'),
  cursor: CursorSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type OwnerOfferQuery = z.infer<typeof OwnerOfferQuerySchema>;

const OfferFieldsSchema = z.strictObject({
  titleEn: z.string().trim().min(1).max(80),
  titleHi: z.string().trim().min(1).max(80).nullable(),
  discountType: OfferDiscountTypeSchema,
  /** percent: 1–100; null otherwise. */
  discountPercent: z.number().int().min(1).max(100).nullable(),
  /** flat: positive paise; null otherwise. */
  discountPaise: PaiseSchema.min(1).nullable(),
  validFrom: TimestampSchema,
  validTo: TimestampSchema,
});

const shape = (offer: z.infer<typeof OfferFieldsSchema>, ctx: z.RefinementCtx) => {
  const ok =
    (offer.discountType === 'percent' && offer.discountPercent !== null && offer.discountPaise === null) ||
    (offer.discountType === 'flat' && offer.discountPaise !== null && offer.discountPercent === null) ||
    (offer.discountType === 'free_delivery' && offer.discountPercent === null && offer.discountPaise === null);
  if (!ok) ctx.addIssue({ code: 'custom', path: ['discountType'], message: 'discount shape' });
  if (Date.parse(offer.validTo) <= Date.parse(offer.validFrom))
    ctx.addIssue({ code: 'custom', path: ['validTo'], message: 'validTo must be after validFrom' });
};

/** Create: always enters pending approval. */
export const OfferCreateSchema = OfferFieldsSchema.superRefine(shape);
export type OfferCreate = z.infer<typeof OfferCreateSchema>;
/** Edit: full replacement of editable fields; re-queues approval. */
export const OfferUpdateSchema = OfferFieldsSchema.extend({
  expectedVersion: VersionSchema,
}).superRefine(shape);
export type OfferUpdate = z.infer<typeof OfferUpdateSchema>;

export const OfferStatusCommandSchema = z.strictObject({
  status: z.enum(['active', 'paused', 'ended']),
  expectedVersion: VersionSchema,
});
export type OfferStatusCommand = z.infer<typeof OfferStatusCommandSchema>;

export const OwnerOfferSchema = z.strictObject({
  id: IdSchema,
  titleEn: z.string(),
  titleHi: z.string().nullable(),
  discountType: OfferDiscountTypeSchema,
  discountPercent: z.number().int().nullable(),
  discountPaise: PaiseSchema.nullable(),
  validFrom: TimestampSchema,
  validTo: TimestampSchema,
  status: OfferStatusSchema,
  reviewDecision: z.enum(['approved', 'rejected']).nullable(),
  rejectionReason: z.string().nullable(),
  /** validTo has passed (shown as Expired whatever the stored status). */
  expired: z.boolean(),
  viewsCount: CountSchema,
  usesCount: CountSchema,
  version: VersionSchema,
  /** Server-decided owner actions for the current state. */
  allowedActions: z.array(z.enum(['edit', 'pause', 'resume', 'end'])),
});
export type OwnerOffer = z.infer<typeof OwnerOfferSchema>;

export const OwnerOfferPageSchema = z.strictObject({
  items: z.array(OwnerOfferSchema),
  nextCursor: CursorSchema.nullable(),
});
export type OwnerOfferPage = z.infer<typeof OwnerOfferPageSchema>;
