import { z } from 'zod';
import { ExploreCardSchema } from './search.js';
import { CatalogSlugSchema } from './catalog.js';
import { PublicImageVariantSchema } from './media.js';

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
export const BusinessDiscoveryDetailSchema = PublicListingDetailSchema.extend({
  item: ExploreCardSchema.extend({ kind: z.literal('shop') }),
  hours: z.array(z.strictObject({
    dayOfWeek: z.number().int().min(0).max(6),
    opensAt: z.string().nullable(), closesAt: z.string().nullable(), isClosed: z.boolean(),
  })),
});
export type BusinessDiscoveryDetail = z.infer<typeof BusinessDiscoveryDetailSchema>;
