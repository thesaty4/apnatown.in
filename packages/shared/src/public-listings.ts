import { z } from 'zod';
import { ExploreCardSchema } from './search.js';
import { CatalogSlugSchema } from './catalog.js';
import { PublicImageVariantSchema } from './media.js';
import { IdSchema } from './wire.js';
import { CART_LINE_MAX_QUANTITY } from './cart.js';

export const PublicListingParamsSchema = z.strictObject({ slug: CatalogSlugSchema });
/** Minimal real owner detail projection; no fabricated checkout/enquiry actions. */
export const PublicListingDetailSchema = z.strictObject({
  item: ExploreCardSchema,
  description: z.string().nullable(),
  images: z.array(PublicImageVariantSchema).max(5),
});
export type PublicListingDetail = z.infer<typeof PublicListingDetailSchema>;
export const ProductPublicSchema = PublicListingDetailSchema.extend({
  item: ExploreCardSchema.extend({ kind: z.literal('product') }),
  /** Category breadcrumb IDs (the card carries slugs/labels only). */
  categoryId: IdSchema,
  subcategoryId: IdSchema,
  /** Active selectable labels by position; empty → add with `variantId: null`. */
  variants: z.array(z.strictObject({ id: IdSchema, label: z.string().min(1) })).max(20),
  /** Shared product stock; `maxQuantity` = available ? min(10, onHand) : 0. */
  inventory: z.strictObject({
    inStock: z.boolean(),
    maxQuantity: z.number().int().min(0).max(CART_LINE_MAX_QUANTITY),
  }),
  orderability: z.strictObject({
    orderable: z.literal(false),
    reasonCode: z.literal('CHECKOUT_UNAVAILABLE'),
  }),
});
export type ProductPublic = z.infer<typeof ProductPublicSchema>;
export const ServicePublicSchema = PublicListingDetailSchema.extend({
  item: ExploreCardSchema.extend({ kind: z.literal('service') }),
  included: z.array(z.string()), excluded: z.array(z.string()),
  serviceArea: z.string().nullable(), experienceYears: z.number().int().nonnegative().nullable(),
});
export type ServicePublic = z.infer<typeof ServicePublicSchema>;
const BusinessDiscoveryHoursSchema = z.strictObject({
  dayOfWeek: z.number().int().min(0).max(6),
  opensAt: z.string().nullable(), closesAt: z.string().nullable(), isClosed: z.boolean(),
});
const PublicProductCategorySchema = z.strictObject({
  id: IdSchema, slug: CatalogSlugSchema, nameEn: z.string().min(1), nameHi: z.string().min(1),
});
/**
 * Stored, approved public profile fields only (BusinessPublicDto subset). No
 * owner login contact, KYC, application or document data; unknown is null.
 */
export const BusinessPublicProfileSchema = z.strictObject({
  kind: z.enum(['shop', 'provider']),
  /** PRODUCT categories only, primary first then Catalog order. */
  categories: z.array(PublicProductCategorySchema),
  primaryCategory: PublicProductCategorySchema.nullable(),
  /** Media gateway descriptors; null unless an attached, allowed, ready asset exists. */
  logo: PublicImageVariantSchema.nullable(),
  cover: PublicImageVariantSchema.nullable(),
  addressText: z.string().nullable(),
  /** Only an explicitly stored business pin; never derived. */
  location: z.strictObject({
    lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180),
  }).nullable(),
  /** Today's Asia/Kolkata schedule at read time; null when not set. */
  today: BusinessDiscoveryHoursSchema.nullable(),
  temporarilyClosed: z.boolean(),
  /** Null when delivery settings were never stored. */
  delivery: z.strictObject({
    /** True only when method, radius, minimum (and self fee) are configured. */
    enabled: z.boolean(), radiusKm: z.number().nonnegative().nullable(),
  }).nullable(),
  pickup: z.boolean(),
  serviceArea: z.string().nullable(),
  serviceRadiusKm: z.number().nonnegative().nullable(),
  socialLinks: z.strictObject({
    instagramUrl: z.string().nullable(), facebookUrl: z.string().nullable(),
    /** No stored website column yet; always null until Businesses stores one. */
    websiteUrl: z.string().nullable(), youtubeUrl: z.string().nullable(),
  }),
});
export type BusinessPublicProfile = z.infer<typeof BusinessPublicProfileSchema>;
export const BusinessDiscoveryDetailSchema = PublicListingDetailSchema.extend({
  item: ExploreCardSchema.extend({ kind: z.literal('shop') }),
  hours: z.array(BusinessDiscoveryHoursSchema),
  profile: BusinessPublicProfileSchema,
});
export type BusinessDiscoveryDetail = z.infer<typeof BusinessDiscoveryDetailSchema>;
