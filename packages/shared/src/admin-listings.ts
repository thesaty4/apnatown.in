// Admin Listings (S-ADMN-03, F-AD-003) and listing reports (F-PF-007).
// Re-exported from `admin.ts`; must not import `admin.ts` (ESM cycle).
import { z } from 'zod';
import {
  CountSchema,
  CursorSchema,
  IdSchema,
  PageQuerySchema,
  TimestampSchema,
  VersionSchema,
} from './wire.js';
import {
  BusinessDecisionActionSchema,
  BusinessKindSchema,
  BusinessStatusSchema,
} from './businesses.js';
import { E164Schema } from './settings.js';

/** Single-line plain text: no angle brackets or control characters. */
const plain = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine((value) => !/[<>\p{Cc}]/u.test(value), {
      message: 'Plain text without angle brackets or control characters',
    });
/** Inert multi-line text (newlines allowed); stored and rendered as text. */
const prose = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((value) => !/[<>]|[^\P{Cc}\n]/u.test(value), {
      message: 'Text without angle brackets or control characters',
    });

export const ADMIN_LISTING_TYPES = ['business', 'provider', 'rider'] as const;
export const AdminListingTypeSchema = z.enum(ADMIN_LISTING_TYPES);
export type AdminListingType = z.infer<typeof AdminListingTypeSchema>;
/** Shipped listing types (Delivery/riders has not shipped). */
export const AdminBusinessListingTypeSchema = z.enum(['business', 'provider']);
export type AdminBusinessListingType = z.infer<
  typeof AdminBusinessListingTypeSchema
>;
/** Listing statuses; drafts are not listings. */
export const AdminListingStatusSchema = BusinessStatusSchema.exclude(['draft']);
export type AdminListingStatus = z.infer<typeof AdminListingStatusSchema>;
export const ADMIN_LISTING_ACTIONS = [
  'edit',
  'remove',
  ...BusinessDecisionActionSchema.options,
] as const;
export const AdminListingActionSchema = z.enum(ADMIN_LISTING_ACTIONS);
export type AdminListingAction = z.infer<typeof AdminListingActionSchema>;
/** Requested blocks whose owning module has not shipped (never zeros). */
export const AdminListingUnavailableSchema = z.enum(['rider', 'rating']);

export const AdminListingQuerySchema = PageQuerySchema.extend({
  type: AdminListingTypeSchema.default('business'),
  q: plain(1, 80).optional(),
  status: AdminListingStatusSchema.optional(),
});
export type AdminListingQuery = z.infer<typeof AdminListingQuerySchema>;
export const AdminListingCardSchema = z.strictObject({
  type: AdminBusinessListingTypeSchema,
  id: IdSchema,
  nameEn: z.string().nullable(),
  nameHi: z.string().nullable(),
  categoryId: IdSchema.nullable(),
  cityId: IdSchema.nullable(),
  areaId: IdSchema.nullable(),
  /** Reviews has not shipped: always null with `unavailable: ['rating']`. */
  rating: z
    .strictObject({ average: z.number().min(0).max(5), count: CountSchema })
    .nullable(),
  openReportCount: CountSchema,
  status: AdminListingStatusSchema,
  version: VersionSchema,
});
export type AdminListingCard = z.infer<typeof AdminListingCardSchema>;
export const AdminListingPageSchema = z.strictObject({
  items: z.array(AdminListingCardSchema).max(50),
  nextCursor: CursorSchema.nullable(),
  unavailable: z.array(AdminListingUnavailableSchema),
});
export type AdminListingPage = z.infer<typeof AdminListingPageSchema>;
export const AdminListingParamsSchema = z.strictObject({
  type: AdminBusinessListingTypeSchema,
  id: IdSchema,
});
export type AdminListingParams = z.infer<typeof AdminListingParamsSchema>;

// Listing reports
export const LISTING_REPORT_REASONS = [
  'fake',
  'wrong',
  'abuse',
  'closed',
] as const;
export const ListingReportReasonSchema = z.enum(LISTING_REPORT_REASONS);
export type ListingReportReason = z.infer<typeof ListingReportReasonSchema>;
export const ListingReportStatusSchema = z.enum(['open', 'resolved']);
export type ListingReportStatus = z.infer<typeof ListingReportStatusSchema>;
export const ListingReportResolutionValueSchema = z.enum([
  'dismissed',
  'action_taken',
]);
export const ListingReportCreateSchema = z.strictObject({
  targetType: AdminBusinessListingTypeSchema,
  targetId: IdSchema,
  reason: ListingReportReasonSchema,
  details: prose(500).optional(),
});
export type ListingReportCreate = z.infer<typeof ListingReportCreateSchema>;
export const ListingReportAcceptedSchema = z.strictObject({
  reportId: IdSchema,
});
export type ListingReportAccepted = z.infer<typeof ListingReportAcceptedSchema>;
/** Admin projection: reporter masked, the subject hash is never returned. */
export const AdminListingReportSchema = z.strictObject({
  id: IdSchema,
  targetType: AdminBusinessListingTypeSchema,
  targetId: IdSchema,
  reason: ListingReportReasonSchema,
  /** Inert reporter text; render as text only. */
  details: z.string().nullable(),
  reporter: z.enum(['account', 'guest']),
  cityId: IdSchema,
  areaId: IdSchema,
  status: ListingReportStatusSchema,
  resolution: ListingReportResolutionValueSchema.nullable(),
  resolutionNote: z.string().nullable(),
  resolvedAt: TimestampSchema.nullable(),
  createdAt: TimestampSchema,
  version: VersionSchema,
});
export type AdminListingReport = z.infer<typeof AdminListingReportSchema>;
export const AdminListingReportPageSchema = z.strictObject({
  items: z.array(AdminListingReportSchema).max(50),
  nextCursor: CursorSchema.nullable(),
});
export type AdminListingReportPage = z.infer<
  typeof AdminListingReportPageSchema
>;
export const AdminListingReportQuerySchema = PageQuerySchema.extend({
  targetId: IdSchema.optional(),
  status: ListingReportStatusSchema.default('open'),
});
export type AdminListingReportQuery = z.infer<
  typeof AdminListingReportQuerySchema
>;
export const AdminListingReportParamsSchema = z.strictObject({ id: IdSchema });
export const AdminListingReportResolutionSchema = z.strictObject({
  resolution: ListingReportResolutionValueSchema,
  note: prose(500).optional(),
  expectedVersion: VersionSchema,
});
export type AdminListingReportResolution = z.infer<
  typeof AdminListingReportResolutionSchema
>;

/** Owning business detail with the full contact for authorized editing. */
export const AdminBusinessListingSchema = z.strictObject({
  id: IdSchema,
  kind: BusinessKindSchema,
  status: AdminListingStatusSchema,
  nameEn: z.string().nullable(),
  nameHi: z.string().nullable(),
  categoryId: IdSchema.nullable(),
  cityId: IdSchema.nullable(),
  areaId: IdSchema.nullable(),
  ownerUserId: IdSchema,
  phoneE164: E164Schema,
  addressText: z.string().nullable(),
  logoAssetId: IdSchema.nullable(),
  coverAssetId: IdSchema.nullable(),
  submittedAt: TimestampSchema.nullable(),
  createdAt: TimestampSchema,
  version: VersionSchema,
});
export type AdminBusinessListing = z.infer<typeof AdminBusinessListingSchema>;
export const AdminListingDetailSchema = z.strictObject({
  type: AdminBusinessListingTypeSchema,
  listing: AdminBusinessListingSchema,
  rating: AdminListingCardSchema.shape.rating,
  reports: z.strictObject({
    openCount: CountSchema,
    items: z.array(AdminListingReportSchema).max(50),
    nextCursor: CursorSchema.nullable(),
  }),
  /** Actions this caller may take now (permission-, scope- and state-aware). */
  allowedActions: z.array(AdminListingActionSchema),
  unavailable: z.array(AdminListingUnavailableSchema),
});
export type AdminListingDetail = z.infer<typeof AdminListingDetailSchema>;

// Listing commands
export const AdminListingCreateSchema = z.strictObject({
  type: AdminListingTypeSchema,
  nameEn: plain(2, 80),
  nameHi: plain(1, 80).optional(),
  phoneE164: E164Schema,
  areaId: IdSchema,
});
export type AdminListingCreate = z.infer<typeof AdminListingCreateSchema>;
export const AdminListingEditSchema = z
  .strictObject({
    nameEn: plain(2, 80).optional(),
    nameHi: plain(1, 80).nullable().optional(),
    phoneE164: E164Schema.optional(),
    areaId: IdSchema.optional(),
    statusAction: BusinessDecisionActionSchema.optional(),
    /** Audit input; the review reason for reject/request_changes. */
    note: plain(1, 500).optional(),
    expectedVersion: VersionSchema,
  })
  .refine(
    (value) =>
      value.nameEn !== undefined ||
      value.nameHi !== undefined ||
      value.phoneE164 !== undefined ||
      value.areaId !== undefined ||
      value.statusAction !== undefined,
    { message: 'At least one change is required' },
  )
  .refine(
    (value) =>
      !['reject', 'request_changes'].includes(value.statusAction ?? '') ||
      !!value.note,
    { path: ['note'], message: 'Reason required' },
  );
export type AdminListingEdit = z.infer<typeof AdminListingEditSchema>;
export const AdminListingRemoveSchema = z.strictObject({
  expectedVersion: VersionSchema,
  note: plain(1, 500).optional(),
});
export type AdminListingRemove = z.infer<typeof AdminListingRemoveSchema>;
export const AdminListingMutationResultSchema = z.strictObject({
  type: AdminBusinessListingTypeSchema,
  id: IdSchema,
  status: AdminListingStatusSchema,
  deleted: z.boolean(),
  version: VersionSchema,
});
export type AdminListingMutationResult = z.infer<
  typeof AdminListingMutationResultSchema
>;

// Products under a listing
export const AdminListingProductParamsSchema = z.strictObject({
  businessId: IdSchema,
});
export const AdminListingProductSchema = z.strictObject({
  id: IdSchema,
  businessId: IdSchema,
  nameEn: z.string(),
  nameHi: z.string().nullable(),
  slug: z.string(),
  published: z.boolean(),
  availableForSale: z.boolean(),
  stock: z.number().int().min(0),
  version: VersionSchema,
});
export type AdminListingProduct = z.infer<typeof AdminListingProductSchema>;
export const AdminListingProductPageSchema = z.strictObject({
  items: z.array(AdminListingProductSchema).max(50),
  nextCursor: CursorSchema.nullable(),
});
export type AdminListingProductPage = z.infer<
  typeof AdminListingProductPageSchema
>;
export const AdminProductParamsSchema = z.strictObject({ productId: IdSchema });
export const AdminProductPublicationSchema = z.strictObject({
  published: z.boolean(),
  /** Stable reason key (audit/notification copy key), never free text. */
  reasonKey: z.string().regex(/^[a-z][a-z0-9_.]{1,63}$/),
  expectedVersion: VersionSchema,
});
export type AdminProductPublication = z.infer<
  typeof AdminProductPublicationSchema
>;
export const AdminProductPublicationResultSchema = z.strictObject({
  id: IdSchema,
  businessId: IdSchema,
  published: z.boolean(),
  version: VersionSchema,
});
export type AdminProductPublicationResult = z.infer<
  typeof AdminProductPublicationResultSchema
>;

// Events
export const LISTING_EVENT_TYPES = Object.freeze({
  listingReported: 'listing.reported',
} as const);
export const ListingReportedPayloadSchema = z.strictObject({
  reportId: IdSchema,
  targetType: AdminBusinessListingTypeSchema,
  targetId: IdSchema,
  cityId: IdSchema,
  areaId: IdSchema,
});
export type ListingReportedPayload = z.infer<
  typeof ListingReportedPayloadSchema
>;
