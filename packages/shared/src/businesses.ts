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
import {
  E164Schema,
  GstinSchema,
  PrivateRefSchema,
  StateCodeSchema,
} from './settings.js';
import { MediaGatewayPathSchema } from './media.js';

/**
 * Businesses wire contracts (F-PF-001..013, F-VD-001..003/011/018,
 * F-PV-001/002/006/007, F-X-011): applications, owner profile/settings/hours,
 * public profile, approvals, billing identity and reporting-v1 profile views.
 * Shared by the API, the generated client and the web app.
 */

export const BUSINESS_KINDS = ['shop', 'provider'] as const;
export const BusinessKindSchema = z.enum(BUSINESS_KINDS);
export type BusinessKind = z.infer<typeof BusinessKindSchema>;
/** Owner-route header selecting which owned application is intended. */
export const BUSINESS_KIND_HEADER = 'x-business-kind';

export const BUSINESS_STATUSES = [
  'draft',
  'pending',
  'approved',
  'rejected',
  'changes_requested',
  'suspended',
  'inactive',
] as const;
export const BusinessStatusSchema = z.enum(BUSINESS_STATUSES);
export type BusinessStatus = z.infer<typeof BusinessStatusSchema>;

export const BUSINESS_DOCUMENT_KINDS = [
  'owner_id',
  'business_photo',
  'registration_document',
] as const;
export const BusinessDocumentKindSchema = z.enum(BUSINESS_DOCUMENT_KINDS);
export type BusinessDocumentKind = z.infer<typeof BusinessDocumentKindSchema>;

export const DELIVERY_METHODS = ['self', 'apna_town_rider'] as const;
export const DeliveryMethodSchema = z.enum(DELIVERY_METHODS);
export type DeliveryMethod = z.infer<typeof DeliveryMethodSchema>;

/** ST-approval admin actions. */
export const BUSINESS_DECISION_ACTIONS = [
  'approve',
  'reject',
  'request_changes',
  'suspend',
  'restore',
  'deactivate',
] as const;
export const BusinessDecisionActionSchema = z.enum(BUSINESS_DECISION_ACTIONS);
export type BusinessDecisionAction = z.infer<
  typeof BusinessDecisionActionSchema
>;

/** Recurring IST wall-clock time `HH:MM` (not an instant). */
export const WallTimeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
export const IstDateSchema = z.iso.date();

const plain = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine((value) => !/[<>\p{Cc}]/u.test(value), {
      message: 'Plain text without angle brackets or control characters',
    });
// Multi-line free text: newlines allowed, other control characters are not.
const prose = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((value) => !/[<>]|[^\P{Cc}\n]/u.test(value), {
      message: 'Text without angle brackets or control characters',
    });
const reason = plain(1, 500);
const httpsUrl = (hosts: readonly string[]) =>
  z
    .url({ protocol: /^https$/ })
    .max(500)
    .refine((value) => {
      const host = new URL(value).hostname.toLowerCase();
      return hosts.some((item) => host === item || host.endsWith(`.${item}`));
    }, 'HTTPS link on the expected social network');
const radiusKm = z
  .number()
  .min(0)
  .max(999.99)
  .refine((value) => Math.round(value * 100) === value * 100, {
    message: 'At most two decimals',
  });

export const BusinessLocationSchema = z.strictObject({
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
});
export type BusinessLocation = z.infer<typeof BusinessLocationSchema>;

export const BusinessHoursEntrySchema = z
  .strictObject({
    dayOfWeek: z.number().int().min(0).max(6),
    opensAt: WallTimeSchema.nullable(),
    closesAt: WallTimeSchema.nullable(),
    isClosed: z.boolean(),
  })
  // Open days have both times (distinct); closed days have neither.
  .refine((day) =>
    day.isClosed
      ? day.opensAt === null && day.closesAt === null
      : day.opensAt !== null &&
        day.closesAt !== null &&
        day.opensAt !== day.closesAt,
  );
export type BusinessHoursEntry = z.infer<typeof BusinessHoursEntrySchema>;
/** A supplied schedule replaces all seven unique days. */
export const BusinessWeekSchema = z
  .array(BusinessHoursEntrySchema)
  .length(7)
  .refine(
    (days) => new Set(days.map((day) => day.dayOfWeek)).size === 7,
    'Seven unique days',
  );

export const BusinessSettingsSchema = z.strictObject({
  temporarilyClosed: z.boolean(),
  deliveryMethod: DeliveryMethodSchema.nullable(),
  deliveryRadiusKm: radiusKm.nullable(),
  deliveryFeePaise: PaiseSchema.nullable(),
  minimumOrderPaise: PaiseSchema.nullable(),
  pickupEnabled: z.boolean(),
  pickupInstructions: plain(1, 300).nullable(),
  serviceRadiusKm: radiusKm.nullable(),
  serviceArea: plain(1, 200).nullable(),
  galleryMediaDefault: z.boolean(),
});
export type BusinessSettings = z.infer<typeof BusinessSettingsSchema>;
export const BusinessSettingsPatchSchema = BusinessSettingsSchema.partial();
export type BusinessSettingsPatch = z.infer<typeof BusinessSettingsPatchSchema>;

export const BUSINESS_CATEGORY_LIMIT = 10;

/** Explicit allow-listed owner patch; unknown/nested unknown keys fail. */
export const BusinessProfilePatchSchema = z
  .strictObject({
    expectedVersion: VersionSchema,
    kind: BusinessKindSchema.optional(),
    nameEn: plain(2, 80).nullable().optional(),
    nameHi: plain(1, 80).nullable().optional(),
    categoryIds: z
      .array(IdSchema)
      .max(BUSINESS_CATEGORY_LIMIT)
      .refine((ids) => new Set(ids).size === ids.length, 'Distinct IDs')
      .optional(),
    primaryCategoryId: IdSchema.nullable().optional(),
    description: prose(1000).nullable().optional(),
    areaId: IdSchema.nullable().optional(),
    addressText: plain(5, 300).nullable().optional(),
    location: BusinessLocationSchema.nullable().optional(),
    businessPhoneE164: E164Schema.optional(),
    whatsappE164: E164Schema.nullable().optional(),
    email: z.email().max(254).nullable().optional(),
    instagramUrl: httpsUrl(['instagram.com']).nullable().optional(),
    youtubeUrl: httpsUrl(['youtube.com', 'youtu.be']).nullable().optional(),
    facebookUrl: httpsUrl(['facebook.com', 'fb.com']).nullable().optional(),
    logoAssetId: IdSchema.nullable().optional(),
    coverAssetId: IdSchema.nullable().optional(),
    hours: BusinessWeekSchema.optional(),
    settings: BusinessSettingsPatchSchema.optional(),
  })
  // The primary must belong to a supplied category set.
  .refine(
    (patch) =>
      patch.categoryIds === undefined ||
      (patch.categoryIds.length === 0
        ? !patch.primaryCategoryId
        : typeof patch.primaryCategoryId === 'string' &&
          patch.categoryIds.includes(patch.primaryCategoryId)),
    { path: ['primaryCategoryId'], message: 'Primary must be in categoryIds' },
  );
export type BusinessProfilePatch = z.infer<typeof BusinessProfilePatchSchema>;

export const CreateBusinessApplicationSchema = z.strictObject({
  kind: BusinessKindSchema,
});
export type CreateBusinessApplication = z.infer<
  typeof CreateBusinessApplicationSchema
>;
export const BusinessVersionCommandSchema = z.strictObject({
  expectedVersion: VersionSchema,
});
export type BusinessVersionCommand = z.infer<
  typeof BusinessVersionCommandSchema
>;

/** Server-derived owner capabilities; never a client flag. */
export const BusinessCapabilitiesSchema = z.strictObject({
  editProfile: z.boolean(),
  changeKind: z.boolean(),
  submit: z.boolean(),
  reactivate: z.boolean(),
  uploadDocuments: z.boolean(),
  uploadMedia: z.boolean(),
  sell: z.boolean(),
  publicProfile: z.boolean(),
});
export type BusinessCapabilities = z.infer<typeof BusinessCapabilitiesSchema>;

export const BusinessCategoryRefSchema = z.strictObject({
  id: IdSchema,
  slug: z.string().min(1).max(80),
  nameEn: z.string(),
  nameHi: z.string(),
});
export type BusinessCategoryRef = z.infer<typeof BusinessCategoryRefSchema>;

/** Owner application/profile DTO (GET/PATCH `/businesses/me`). */
export const BusinessOwnerSchema = z.strictObject({
  id: IdSchema,
  kind: BusinessKindSchema,
  status: BusinessStatusSchema,
  slug: z.string().nullable(),
  nameEn: z.string().nullable(),
  nameHi: z.string().nullable(),
  categoryIds: z.array(IdSchema),
  primaryCategoryId: IdSchema.nullable(),
  description: z.string().nullable(),
  cityId: IdSchema.nullable(),
  areaId: IdSchema.nullable(),
  addressText: z.string().nullable(),
  location: BusinessLocationSchema.nullable(),
  businessPhoneE164: E164Schema,
  whatsappE164: E164Schema.nullable(),
  email: z.string().nullable(),
  instagramUrl: z.string().nullable(),
  youtubeUrl: z.string().nullable(),
  facebookUrl: z.string().nullable(),
  logoAssetId: IdSchema.nullable(),
  coverAssetId: IdSchema.nullable(),
  hours: z.array(BusinessHoursEntrySchema),
  settings: BusinessSettingsSchema,
  verified: z.boolean(),
  reviewReason: z.string().nullable(),
  reviewedAt: TimestampSchema.nullable(),
  submittedAt: TimestampSchema.nullable(),
  capabilities: BusinessCapabilitiesSchema,
  version: VersionSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type BusinessOwner = z.infer<typeof BusinessOwnerSchema>;

/** Resolved public image; path is same-origin and reauthorized by Media. */
export const BusinessPublicImageSchema = z.strictObject({
  assetId: IdSchema,
  path: MediaGatewayPathSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});
export const BusinessPublicSchema = z.strictObject({
  id: IdSchema,
  kind: BusinessKindSchema,
  slug: z.string(),
  nameEn: z.string(),
  nameHi: z.string().nullable(),
  categories: z.array(BusinessCategoryRefSchema),
  primaryCategory: BusinessCategoryRefSchema.nullable(),
  description: z.string().nullable(),
  logo: BusinessPublicImageSchema.nullable(),
  cover: BusinessPublicImageSchema.nullable(),
  contacts: z.strictObject({
    phoneE164: E164Schema,
    whatsappE164: E164Schema.nullable(),
    email: z.string().nullable(),
  }),
  socialLinks: z.strictObject({
    instagramUrl: z.string().nullable(),
    youtubeUrl: z.string().nullable(),
    facebookUrl: z.string().nullable(),
  }),
  address: z.string().nullable(),
  cityId: IdSchema,
  areaId: IdSchema,
  area: z
    .strictObject({ id: IdSchema, nameEn: z.string(), nameHi: z.string() })
    .nullable(),
  location: BusinessLocationSchema.nullable(),
  weeklyHours: z.array(BusinessHoursEntrySchema),
  /** Today's IST schedule at read time; null when hours are not set. */
  today: BusinessHoursEntrySchema.nullable(),
  temporarilyClosed: z.boolean(),
  delivery: z.strictObject({
    /** False until method/radius/minimum (and self fee) are configured. */
    available: z.boolean(),
    method: DeliveryMethodSchema.nullable(),
    radiusKm: z.number().nullable(),
    feePaise: PaiseSchema.nullable(),
    minimumOrderPaise: PaiseSchema.nullable(),
  }),
  pickup: z.strictObject({
    enabled: z.boolean(),
    instructions: z.string().nullable(),
  }),
  serviceArea: z.string().nullable(),
  serviceRadiusKm: z.number().nullable(),
  verified: z.boolean(),
});
export type BusinessPublic = z.infer<typeof BusinessPublicSchema>;
export const BusinessSlugParamsSchema = z.strictObject({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});
export type BusinessSlugParams = z.infer<typeof BusinessSlugParamsSchema>;

export const BusinessMediaUploadSchema = z.strictObject({
  assetKind: z.enum(['logo', 'cover']),
});
export type BusinessMediaUpload = z.infer<typeof BusinessMediaUploadSchema>;
export const BusinessMediaUploadResultSchema = z.strictObject({
  assetId: IdSchema,
  status: z.enum(['processing', 'ready']),
});
export type BusinessMediaUploadResult = z.infer<
  typeof BusinessMediaUploadResultSchema
>;
export const BusinessDocumentUploadSchema = z.strictObject({
  documentKind: BusinessDocumentKindSchema,
});
export type BusinessDocumentUpload = z.infer<
  typeof BusinessDocumentUploadSchema
>;
export const BusinessDocumentUploadResultSchema = z.strictObject({
  documentId: IdSchema,
  documentKind: BusinessDocumentKindSchema,
  assetId: IdSchema,
  status: z.enum(['processing', 'ready']),
});
export type BusinessDocumentUploadResult = z.infer<
  typeof BusinessDocumentUploadResultSchema
>;

// ---------------------------------------------------------------------------
// Owner overview and provider analytics (reporting-v1)
// ---------------------------------------------------------------------------

export const SECTION_UNAVAILABLE_CODES = [
  'SOURCE_UNAVAILABLE',
  'NOT_APPLICABLE',
] as const;
const unavailable = z.strictObject({
  state: z.literal('unavailable'),
  code: z.enum(SECTION_UNAVAILABLE_CODES),
});
const section = <T extends z.ZodType>(data: T) =>
  z.discriminatedUnion('state', [
    z.strictObject({ state: z.literal('ready'), data }),
    unavailable,
  ]);
/** Owner sections whose source module has not shipped yet. */
const pendingSource = unavailable;

export const BusinessSummarySchema = z.strictObject({
  id: IdSchema,
  kind: BusinessKindSchema,
  status: BusinessStatusSchema,
  slug: z.string().nullable(),
  nameEn: z.string().nullable(),
  nameHi: z.string().nullable(),
  version: VersionSchema,
});
export type BusinessSummary = z.infer<typeof BusinessSummarySchema>;
export const BusinessViewsSummarySchema = z.strictObject({
  period: z.literal('30d'),
  views: CountSchema,
  asOf: TimestampSchema,
  coverageStartedAt: TimestampSchema.nullable(),
});
export const BusinessOverviewSchema = z.strictObject({
  business: BusinessSummarySchema,
  status: BusinessStatusSchema,
  capabilities: BusinessCapabilitiesSchema,
  products: pendingSource,
  orders: pendingSource,
  earnings: pendingSource,
  enquiries: pendingSource,
  rating: pendingSource,
  followers: pendingSource,
  analytics: section(BusinessViewsSummarySchema),
});
export type BusinessOverview = z.infer<typeof BusinessOverviewSchema>;

export const ANALYTICS_PERIODS = ['30d'] as const;
export const BusinessAnalyticsQuerySchema = z.strictObject({
  period: z.enum(ANALYTICS_PERIODS).default('30d'),
});
export type BusinessAnalyticsQuery = z.infer<
  typeof BusinessAnalyticsQuerySchema
>;
export const ANALYTICS_UNAVAILABLE_METRICS = [
  'views_before_coverage',
  'enquiries',
  'converted',
  'conversionRate',
  'statusCounts',
] as const;
export const BusinessAnalyticsSchema = z.strictObject({
  period: z.enum(ANALYTICS_PERIODS),
  /** Window-deduplicated views over covered days; null when none covered. */
  views: CountSchema.nullable(),
  enquiries: CountSchema.nullable(),
  converted: CountSchema.nullable(),
  /** Converted cohort / cohort size; null for an empty or unknown cohort. */
  conversionRate: z.number().min(0).max(1).nullable(),
  daily: z.array(
    z.strictObject({
      date: IstDateSchema,
      views: CountSchema.nullable(),
      enquiries: CountSchema.nullable(),
    }),
  ),
  statusCounts: z.record(z.string(), CountSchema).nullable(),
  asOf: TimestampSchema,
  coverageStartedAt: TimestampSchema.nullable(),
  unavailable: z.array(z.enum(ANALYTICS_UNAVAILABLE_METRICS)),
  definitionVersion: z.literal('reporting-v1'),
});
export type BusinessAnalytics = z.infer<typeof BusinessAnalyticsSchema>;

// ---------------------------------------------------------------------------
// Admin approvals
// ---------------------------------------------------------------------------

export const BusinessApplicationQuerySchema = z.strictObject({
  status: z
    .enum([
      'pending',
      'changes_requested',
      'rejected',
      'approved',
      'suspended',
      'inactive',
    ])
    .default('pending'),
  kind: BusinessKindSchema.optional(),
  cursor: CursorSchema.optional(),
  limit: z.preprocess(
    (value) =>
      typeof value === 'string' && /^[1-9]\d{0,2}$/.test(value)
        ? Number(value)
        : value,
    LimitSchema,
  ),
});
export type BusinessApplicationQuery = z.infer<
  typeof BusinessApplicationQuerySchema
>;
export const BusinessApplicationCardSchema = z.strictObject({
  id: IdSchema,
  kind: BusinessKindSchema,
  status: BusinessStatusSchema,
  nameEn: z.string().nullable(),
  nameHi: z.string().nullable(),
  categoryId: IdSchema.nullable(),
  cityId: IdSchema.nullable(),
  areaId: IdSchema.nullable(),
  submittedAt: TimestampSchema.nullable(),
  createdAt: TimestampSchema,
  version: VersionSchema,
  allowedActions: z.array(BusinessDecisionActionSchema),
});
export type BusinessApplicationCard = z.infer<
  typeof BusinessApplicationCardSchema
>;
export const BusinessApplicationPageSchema = z.strictObject({
  items: z.array(BusinessApplicationCardSchema),
  nextCursor: CursorSchema.nullable(),
});
export type BusinessApplicationPage = z.infer<
  typeof BusinessApplicationPageSchema
>;
export const BusinessIdParamsSchema = z.strictObject({ id: IdSchema });
export const BusinessBillingParamsSchema = z.strictObject({
  businessId: IdSchema,
});

export const BusinessDocumentListSchema = z.strictObject({
  items: z.array(
    z.strictObject({
      documentId: IdSchema,
      documentKind: BusinessDocumentKindSchema,
      assetId: IdSchema,
      uploadedAt: TimestampSchema,
      /** Private view capability from Media; unavailable until it ships. */
      view: z.strictObject({
        state: z.literal('unavailable'),
        code: z.literal('SOURCE_UNAVAILABLE'),
      }),
    }),
  ),
});
export type BusinessDocumentList = z.infer<typeof BusinessDocumentListSchema>;

export const BusinessDecisionSchema = z
  .strictObject({
    action: BusinessDecisionActionSchema,
    reason: reason.optional(),
    expectedVersion: VersionSchema,
  })
  .refine(
    (input) =>
      !['reject', 'request_changes'].includes(input.action) || !!input.reason,
    { path: ['reason'], message: 'Reason required' },
  );
export type BusinessDecision = z.infer<typeof BusinessDecisionSchema>;
export const BusinessDecisionResultSchema = z.strictObject({
  id: IdSchema,
  status: BusinessStatusSchema,
  previousStatus: BusinessStatusSchema,
  version: VersionSchema,
  reviewedAt: TimestampSchema,
});
export type BusinessDecisionResult = z.infer<
  typeof BusinessDecisionResultSchema
>;

// ---------------------------------------------------------------------------
// Billing identity (Orders "Invoice and tax policy")
// ---------------------------------------------------------------------------

export const REGISTRATION_MODES = [
  'regular',
  'composition',
  'exempt',
  'unregistered',
] as const;
export const RegistrationModeSchema = z.enum(REGISTRATION_MODES);
const billingFields = {
  legalName: plain(1, 200),
  address: plain(1, 500),
  stateCode: StateCodeSchema,
  registrationMode: RegistrationModeSchema,
  gstin: GstinSchema.optional(),
  authorizedSignatoryRef: PrivateRefSchema.optional(),
};
// Registered modes need a GSTIN issued in the declared state.
const gstinMatchesState = (draft: {
  registrationMode: string;
  stateCode: string;
  gstin?: string | undefined;
}) =>
  !['regular', 'composition'].includes(draft.registrationMode) ||
  draft.gstin?.slice(0, 2) === draft.stateCode;
export const BillingDraftSchema = z
  .strictObject(billingFields)
  .refine(gstinMatchesState, { path: ['gstin'] });
export type BillingDraft = z.infer<typeof BillingDraftSchema>;
/** Owner PUT; first save sends expectedVersion null. */
export const BillingProfileInputSchema = z
  .strictObject({
    ...billingFields,
    expectedVersion: VersionSchema.nullable(),
  })
  .refine(gstinMatchesState, { path: ['gstin'] });
export type BillingProfileInput = z.infer<typeof BillingProfileInputSchema>;
export const BillingReviewStatusSchema = z.enum([
  'missing',
  'pending',
  'approved',
  'rejected',
]);
export const BillingProfileSchema = z.strictObject({
  businessId: IdSchema,
  reviewStatus: BillingReviewStatusSchema,
  draft: BillingDraftSchema.nullable(),
  version: VersionSchema.nullable(),
  approvedVersion: VersionSchema.nullable(),
  reviewReason: z.string().nullable(),
  reviewedAt: TimestampSchema.nullable(),
});
export type BillingProfile = z.infer<typeof BillingProfileSchema>;
export const AdminBillingProfileSchema = BillingProfileSchema.extend({
  ownerUserId: IdSchema,
  verificationEvidenceRef: z.string().nullable(),
  requiresIrn: z.boolean().nullable(),
});
export type AdminBillingProfile = z.infer<typeof AdminBillingProfileSchema>;
export const BillingDecisionSchema = z
  .strictObject({
    decision: z.enum(['approve', 'reject']),
    reason: reason.optional(),
    verificationEvidenceRef: PrivateRefSchema.optional(),
    requiresIrn: z.boolean().optional(),
    expectedVersion: VersionSchema,
  })
  .refine(
    (input) =>
      input.decision === 'reject'
        ? !!input.reason
        : !!input.verificationEvidenceRef && input.requiresIrn !== undefined,
    {
      message: 'Approve needs evidence and IRN applicability; reject a reason',
    },
  );
export type BillingDecision = z.infer<typeof BillingDecisionSchema>;
