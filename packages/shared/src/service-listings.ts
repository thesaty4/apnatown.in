import { z } from 'zod';
import {
  CursorSchema,
  IdSchema,
  LimitSchema,
  PaiseSchema,
  TimestampSchema,
  VersionSchema,
} from './wire.js';

/**
 * Owner service listings (F-VD-014, F-PV-003; S-VEND-13, S-PROV-08). Exactly
 * one subcategory per service (BR-08); money is integer paise. FAQs and
 * experience years are read-only here (Q-52; experience authoring is open).
 */

export const SERVICE_STATUSES = ['active', 'paused'] as const;
export const ServiceStatusSchema = z.enum(SERVICE_STATUSES);
export type ServiceStatus = z.infer<typeof ServiceStatusSchema>;

/** Owner status edges: pause an active listing or reactivate a paused one. */
export const SERVICE_STATUS_TRANSITIONS: Readonly<
  Record<ServiceStatus, readonly ServiceStatus[]>
> = Object.freeze({ active: ['paused'], paused: ['active'] });

export const SERVICE_PRICE_TYPES = ['from', 'fixed', 'range', 'enquiry'] as const;
export const ServicePriceTypeSchema = z.enum(SERVICE_PRICE_TYPES);
export type ServicePriceType = z.infer<typeof ServicePriceTypeSchema>;

export const SERVICE_UNITS = [
  'hour',
  'day',
  'event',
  'sq_ft',
  'unit',
  'visit',
  'plate',
  'month',
] as const;
export const ServiceUnitSchema = z.enum(SERVICE_UNITS);
export type ServiceUnit = z.infer<typeof ServiceUnitSchema>;

/** Media public-image policy: at most five images per service. */
export const SERVICE_MEDIA_LIMIT = 5;
/** TODO(verify): input-size bounds; the spec states no product maximum. */
export const SERVICE_DESCRIPTION_MAX = 2000;
export const SERVICE_LIST_ITEMS_MAX = 20;

const noControl = (value: string) =>
  // eslint-disable-next-line no-control-regex
  !/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/.test(value);
const line = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine((value) => noControl(value) && !/[\r\n\t<>]/.test(value));

/** Trimmed 2–60 character plain-text title. */
export const ServiceTitleSchema = line(2, 60);
const DescriptionSchema = z
  .string()
  .trim()
  .min(1)
  .max(SERVICE_DESCRIPTION_MAX)
  .refine((value) => noControl(value) && !/[<>]/.test(value));
const ListSchema = z.array(line(1, 120)).max(SERVICE_LIST_ITEMS_MAX);
const AreaSchema = line(1, 120);

/** Ordered server-issued image reference; `showInGallery` defaults to false. */
export const ServiceMediaInputSchema = z.strictObject({
  assetId: IdSchema,
  showInGallery: z.boolean().optional(),
});
export type ServiceMediaInput = z.infer<typeof ServiceMediaInputSchema>;
const MediaListSchema = z
  .array(ServiceMediaInputSchema)
  .max(SERVICE_MEDIA_LIMIT)
  .refine(
    (items) => new Set(items.map((item) => item.assetId)).size === items.length,
    { message: 'Duplicate assetId' },
  );

export const ServiceOwnerCreateSchema = z.strictObject({
  nameEn: ServiceTitleSchema,
  nameHi: ServiceTitleSchema.optional(),
  categoryId: IdSchema,
  subcategoryId: IdSchema,
  description: DescriptionSchema.optional(),
  priceType: ServicePriceTypeSchema,
  priceFromPaise: PaiseSchema.optional(),
  priceToPaise: PaiseSchema.optional(),
  unit: ServiceUnitSchema.optional(),
  included: ListSchema.optional(),
  excluded: ListSchema.optional(),
  serviceArea: AreaSchema.optional(),
  media: MediaListSchema.optional(),
  galleryVisible: z.boolean().optional(),
  featuredSelected: z.boolean().optional(),
  status: ServiceStatusSchema.optional(),
});
export type ServiceOwnerCreate = z.infer<typeof ServiceOwnerCreateSchema>;

/** Partial update; `null` clears an optional field. */
export const ServiceOwnerPatchSchema = z
  .strictObject({
    nameEn: ServiceTitleSchema.optional(),
    nameHi: ServiceTitleSchema.nullable().optional(),
    categoryId: IdSchema.optional(),
    subcategoryId: IdSchema.optional(),
    description: DescriptionSchema.nullable().optional(),
    priceType: ServicePriceTypeSchema.optional(),
    priceFromPaise: PaiseSchema.nullable().optional(),
    priceToPaise: PaiseSchema.nullable().optional(),
    unit: ServiceUnitSchema.nullable().optional(),
    included: ListSchema.optional(),
    excluded: ListSchema.optional(),
    serviceArea: AreaSchema.nullable().optional(),
    media: MediaListSchema.optional(),
    galleryVisible: z.boolean().optional(),
    featuredSelected: z.boolean().optional(),
    status: ServiceStatusSchema.optional(),
    expectedVersion: VersionSchema,
  })
  .refine((input) => Object.keys(input).length > 1, {
    message: 'No changes',
  });
export type ServiceOwnerPatch = z.infer<typeof ServiceOwnerPatchSchema>;

export const ServiceOwnerDeleteSchema = z.strictObject({
  expectedVersion: VersionSchema,
});
export type ServiceOwnerDelete = z.infer<typeof ServiceOwnerDeleteSchema>;

export const ServiceOwnerParamsSchema = z.strictObject({ serviceId: IdSchema });
export type ServiceOwnerParams = z.infer<typeof ServiceOwnerParamsSchema>;

export const ServiceOwnerListQuerySchema = z.strictObject({
  status: ServiceStatusSchema.optional(),
  cursor: CursorSchema.optional(),
  limit: z.preprocess(
    (value) =>
      typeof value === 'string' && /^[1-9]\d{0,2}$/.test(value)
        ? Number(value)
        : value,
    LimitSchema,
  ),
});
export type ServiceOwnerListQuery = z.infer<typeof ServiceOwnerListQuerySchema>;

export interface ServicePriceShape {
  priceType: ServicePriceType;
  priceFromPaise: number | null;
  priceToPaise: number | null;
}

/**
 * Price-type rule: enquiry has no amount; fixed/from need only the lower
 * amount; range needs both bounds with to >= from. Returns the offending
 * field, or null when valid.
 */
export function servicePriceViolation(
  price: ServicePriceShape,
): 'priceFromPaise' | 'priceToPaise' | null {
  const { priceType, priceFromPaise: from, priceToPaise: to } = price;
  if (priceType === 'enquiry')
    return from !== null ? 'priceFromPaise' : to !== null ? 'priceToPaise' : null;
  if (from === null) return 'priceFromPaise';
  if (priceType === 'range') return to === null || to < from ? 'priceToPaise' : null;
  return to !== null ? 'priceToPaise' : null;
}

export const ServiceOwnerMediaSchema = z.strictObject({
  assetId: IdSchema,
  showInGallery: z.boolean(),
});

/**
 * Owner service DTO. `featured` is the effective state (selection + current
 * Premium entitlement + active service + public approved business);
 * `featuredSelected` is the retained owner choice.
 */
export const ServiceOwnerSchema = z.strictObject({
  id: IdSchema,
  slug: z.string().min(1),
  categoryId: IdSchema,
  subcategoryId: IdSchema,
  nameEn: z.string(),
  nameHi: z.string().nullable(),
  description: z.string().nullable(),
  priceType: ServicePriceTypeSchema,
  priceFromPaise: PaiseSchema.nullable(),
  priceToPaise: PaiseSchema.nullable(),
  unit: ServiceUnitSchema.nullable(),
  included: z.array(z.string()),
  excluded: z.array(z.string()),
  serviceArea: z.string().nullable(),
  experienceYears: z.number().int().nonnegative().nullable(),
  media: z.array(ServiceOwnerMediaSchema).max(SERVICE_MEDIA_LIMIT),
  galleryVisible: z.boolean(),
  featuredSelected: z.boolean(),
  featured: z.boolean(),
  status: ServiceStatusSchema,
  allowedStatuses: z.array(ServiceStatusSchema),
  version: VersionSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type ServiceOwner = z.infer<typeof ServiceOwnerSchema>;

export const ServiceOwnerPageSchema = z.strictObject({
  items: z.array(ServiceOwnerSchema),
  nextCursor: CursorSchema.nullable(),
});
export type ServiceOwnerPage = z.infer<typeof ServiceOwnerPageSchema>;

export const ServiceOwnerDeletedSchema = z.strictObject({
  id: IdSchema,
  version: VersionSchema,
  deleted: z.literal(true),
});
export type ServiceOwnerDeleted = z.infer<typeof ServiceOwnerDeletedSchema>;
