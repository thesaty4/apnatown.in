import { z } from 'zod';
import {
  CountSchema,
  CursorSchema,
  IdSchema,
  LimitSchema,
  TimestampSchema,
  VersionSchema,
} from './wire.js';
import { PhoneInputSchema } from './users.js';
import { CatalogSlugSchema } from './catalog.js';

/**
 * Services wire contracts: provider expertise (F-PV-002; S-PROV-01/09,
 * S-CUST-07). Expertise is a many-to-many provider/subcategory relation kept
 * separate from a service's single subcategory (BR-08) and never used as a
 * substitute for service subcategory matching in Search.
 */

/** Maximum distinct expertise subcategories per provider. */
export const PROVIDER_EXPERTISE_LIMIT = 50;

const expertiseIds = z.array(IdSchema).max(PROVIDER_EXPERTISE_LIMIT);

/** Owner view; an untouched (empty) expertise set starts at version 1. */
export const ProviderExpertiseSchema = z.strictObject({
  subcategoryIds: expertiseIds,
  expertiseVersion: VersionSchema,
});
export type ProviderExpertise = z.infer<typeof ProviderExpertiseSchema>;

/**
 * Replace-all command guarded by the expertise aggregate version (not the
 * business profile version). Duplicate IDs are collapsed server-side.
 */
export const ProviderExpertiseReplaceSchema = z.strictObject({
  subcategoryIds: expertiseIds,
  expectedVersion: VersionSchema,
});
export type ProviderExpertiseReplace = z.infer<
  typeof ProviderExpertiseReplaceSchema
>;

/** Active service subcategory as shown on a public provider profile. */
export const PublicExpertiseItemSchema = z.strictObject({
  id: IdSchema,
  categoryId: IdSchema,
  slug: CatalogSlugSchema,
  nameEn: z.string().min(1),
  nameHi: z.string().min(1),
});
export type PublicExpertiseItem = z.infer<typeof PublicExpertiseItemSchema>;
export const PublicProviderExpertiseSchema = z.strictObject({
  items: z.array(PublicExpertiseItemSchema).max(PROVIDER_EXPERTISE_LIMIT),
});
export type PublicProviderExpertise = z.infer<
  typeof PublicProviderExpertiseSchema
>;

/*
 * Service enquiries (F-SV-005, F-VD-016, F-PV-004; ST-enquiry; BR-09/BR-14).
 * Guest or signed-in customers submit; only the owning vendor/provider reads
 * them. Names, phones and messages never appear in events, logs or public
 * DTOs; the phone is decrypted only for the owner detail view.
 */

export const ENQUIRY_STATUSES = [
  'new',
  'contacted',
  'converted',
  'closed',
] as const;
export const EnquiryStatusSchema = z.enum(ENQUIRY_STATUSES);
export type EnquiryStatus = z.infer<typeof EnquiryStatusSchema>;

/**
 * Strict ST-enquiry edges: `new -> contacted`, then
 * `contacted -> converted|closed`; converted/closed are terminal until the
 * ST-enquiry/J14/prototype conflict is approved. No reset to `new`.
 */
export const ENQUIRY_STATUS_TRANSITIONS: Readonly<
  Record<EnquiryStatus, readonly EnquiryStatus[]>
> = Object.freeze({
  new: Object.freeze(['contacted'] as const),
  contacted: Object.freeze(['converted', 'closed'] as const),
  converted: Object.freeze([] as const),
  closed: Object.freeze([] as const),
});
export const EnquiryTargetStatusSchema = z.enum([
  'contacted',
  'converted',
  'closed',
]);
export type EnquiryTargetStatus = z.infer<typeof EnquiryTargetStatusSchema>;

const noControl = (value: string) =>
  // eslint-disable-next-line no-control-regex
  !/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/.test(value);

/** Trimmed 2–60 character plain-text name (BR names rule). */
export const EnquiryNameSchema = z
  .string()
  .trim()
  .min(2)
  .max(60)
  .refine((value) => noControl(value) && !/[\r\n\t<>]/.test(value));

/**
 * Required plain-text message; newline/tab allowed. The 1000-character cap is
 * an input-size bound (TODO(verify): no product maximum is specified).
 */
export const ENQUIRY_MESSAGE_MAX = 1000;
export const EnquiryMessageSchema = z
  .string()
  .trim()
  .min(1)
  .max(ENQUIRY_MESSAGE_MAX)
  .refine(noControl);

/** IST calendar date `YYYY-MM-DD`; the server rejects dates before today (IST). */
export const EnquiryPreferredDateSchema = z.iso.date();

/**
 * Public enquiry command. `phone` is a 10-digit Indian mobile number
 * (optionally `+91`-prefixed), normalized to E.164 and encrypted server-side.
 */
export const EnquiryCreateSchema = z.strictObject({
  name: EnquiryNameSchema,
  phone: PhoneInputSchema,
  message: EnquiryMessageSchema,
  preferredDate: EnquiryPreferredDateSchema.optional(),
});
export type EnquiryCreate = z.infer<typeof EnquiryCreateSchema>;
export const EnquiryCreatedSchema = z.strictObject({
  enquiryId: IdSchema,
  status: z.literal('new'),
});
export type EnquiryCreated = z.infer<typeof EnquiryCreatedSchema>;
export const EnquiryServiceParamsSchema = z.strictObject({
  serviceId: IdSchema,
});
export type EnquiryServiceParams = z.infer<typeof EnquiryServiceParamsSchema>;

/** Owner inbox filters; `query` matches name or message text only. */
export const EnquiryInboxQuerySchema = z.strictObject({
  status: EnquiryStatusSchema.optional(),
  query: z.preprocess(
    (value) =>
      typeof value === 'string' && value.trim() === '' ? undefined : value,
    z.string().trim().min(1).max(100).refine(noControl).optional(),
  ),
  cursor: CursorSchema.optional(),
  limit: z.preprocess(
    (value) =>
      typeof value === 'string' && /^[1-9]\d{0,2}$/.test(value)
        ? Number(value)
        : value,
    LimitSchema,
  ),
});
export type EnquiryInboxQuery = z.infer<typeof EnquiryInboxQuerySchema>;

/** Service the enquiry was sent for (owner's own listing, may be paused/deleted). */
export const EnquiryServiceRefSchema = z.strictObject({
  id: IdSchema,
  slug: z.string().min(1),
  nameEn: z.string().min(1),
  nameHi: z.string().nullable(),
});

/** Owner inbox row; no phone in the list. */
export const EnquiryInboxItemSchema = z.strictObject({
  id: IdSchema,
  service: EnquiryServiceRefSchema,
  name: z.string(),
  message: z.string(),
  preferredDate: EnquiryPreferredDateSchema.nullable(),
  status: EnquiryStatusSchema,
  version: VersionSchema,
  createdAt: TimestampSchema,
});
export type EnquiryInboxItem = z.infer<typeof EnquiryInboxItemSchema>;

/** Per-status counts within the same owner and `query`, before the status filter. */
export const EnquiryStatusCountsSchema = z.strictObject({
  new: CountSchema,
  contacted: CountSchema,
  converted: CountSchema,
  closed: CountSchema,
});
export type EnquiryStatusCounts = z.infer<typeof EnquiryStatusCountsSchema>;
export const EnquiryInboxPageSchema = z.strictObject({
  items: z.array(EnquiryInboxItemSchema),
  nextCursor: CursorSchema.nullable(),
  statusCounts: EnquiryStatusCountsSchema,
});
export type EnquiryInboxPage = z.infer<typeof EnquiryInboxPageSchema>;

/**
 * Owner-only detail. `phone` is the decrypted E.164 number for user-initiated
 * call/WhatsApp links; `allowedStatuses` lists the strict ST-enquiry edges.
 */
export const EnquiryDetailSchema = EnquiryInboxItemSchema.extend({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/),
  convertedAt: TimestampSchema.nullable(),
  updatedAt: TimestampSchema,
  allowedStatuses: z.array(EnquiryTargetStatusSchema),
});
export type EnquiryDetail = z.infer<typeof EnquiryDetailSchema>;
export const EnquiryParamsSchema = z.strictObject({ enquiryId: IdSchema });
export type EnquiryParams = z.infer<typeof EnquiryParamsSchema>;

export const EnquiryStatusCommandSchema = z.strictObject({
  status: EnquiryTargetStatusSchema,
  expectedVersion: VersionSchema,
});
export type EnquiryStatusCommand = z.infer<typeof EnquiryStatusCommandSchema>;
export const EnquiryStatusResultSchema = z.strictObject({
  enquiryId: IdSchema,
  status: EnquiryStatusSchema,
  previousStatus: EnquiryStatusSchema,
  version: VersionSchema,
  convertedAt: TimestampSchema.nullable(),
  updatedAt: TimestampSchema,
  allowedStatuses: z.array(EnquiryTargetStatusSchema),
});
export type EnquiryStatusResult = z.infer<typeof EnquiryStatusResultSchema>;

// Owner service listings (F-VD-014, F-PV-003).
export * from './service-listings.js';
