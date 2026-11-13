import type { BusinessPublicProfile } from '@apnatown/shared';
import type { BusinessSettings } from '@apnatown/shared/businesses';
import type { Prisma } from '../../../shared/persistence/generated/client';
import { DEFAULT_SETTINGS, deliveryConfigured } from '../domain/business';

/** Profile without Media-owned descriptors (merged by the service). */
export type BusinessPublicProfileBase = Omit<BusinessPublicProfile, 'logo' | 'cover'>;

interface ProfileRow {
  kind: 'shop' | 'provider';
  addressText: string | null;
  lat: number | null;
  lng: number | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  hasSettings: boolean;
  temporarilyClosed: boolean | null;
  deliveryMethod: string | null;
  deliveryRadiusKm: number | null;
  deliveryFeePaise: bigint | null;
  minimumOrderPaise: bigint | null;
  pickupEnabled: boolean | null;
  serviceArea: string | null;
  serviceRadiusKm: number | null;
}
type Category = BusinessPublicProfile['categories'][number] & { isPrimary: boolean };

/**
 * Public-safe profile facts for an already public (`businesses_public_context`)
 * business. Explicit column allow-list: never owner login phone/email, KYC,
 * application, document, pickup instructions or fee/minimum values.
 */
export async function businessPublicProfile(client: Prisma.TransactionClient, businessId: string): Promise<BusinessPublicProfileBase | null> {
  const [row] = await client.$queryRaw<ProfileRow[]>`
    SELECT b.kind,b.address_text AS "addressText",
      CASE WHEN b.location IS NULL THEN NULL ELSE ST_Y(b.location::geometry) END AS lat,
      CASE WHEN b.location IS NULL THEN NULL ELSE ST_X(b.location::geometry) END AS lng,
      b.instagram_url AS "instagramUrl",b.facebook_url AS "facebookUrl",b.youtube_url AS "youtubeUrl",
      (s.business_id IS NOT NULL) AS "hasSettings",s.temporarily_closed AS "temporarilyClosed",
      s.delivery_method AS "deliveryMethod",s.delivery_radius_km::float8 AS "deliveryRadiusKm",
      s.delivery_fee_paise AS "deliveryFeePaise",s.minimum_order_paise AS "minimumOrderPaise",
      s.pickup_enabled AS "pickupEnabled",s.service_area AS "serviceArea",
      s.service_radius_km::float8 AS "serviceRadiusKm"
    FROM businesses_public_context ctx JOIN businesses b ON b.id=ctx.id
    LEFT JOIN business_settings s ON s.business_id=b.id
    WHERE ctx.id=${businessId}::uuid`;
  if (!row) return null;
  const categories = await client.$queryRaw<Category[]>`
    SELECT c.id::text AS id,c.slug,c.name_en AS "nameEn",c.name_hi AS "nameHi",bc.is_primary AS "isPrimary"
    FROM business_categories bc
    JOIN catalog_discovery_categories c ON c.id=bc.category_id AND c.kind='product'
    WHERE bc.business_id=${businessId}::uuid
    ORDER BY bc.is_primary DESC,c.sort_order,c.id`;
  const [today] = await client.$queryRaw<BusinessPublicProfile['today'][]>`
    SELECT day_of_week::integer AS "dayOfWeek",to_char(opens_at,'HH24:MI') AS "opensAt",
      to_char(closes_at,'HH24:MI') AS "closesAt",is_closed AS "isClosed"
    FROM business_hours WHERE business_id=${businessId}::uuid
      AND day_of_week=extract(dow FROM transaction_timestamp() AT TIME ZONE 'Asia/Kolkata')::integer`;
  const publicCategories = categories.map(({ isPrimary: _isPrimary, ...category }) => category);
  const primary = categories.find((category) => category.isPrimary);
  return {
    kind: row.kind,
    categories: publicCategories,
    primaryCategory: primary ? publicCategories[categories.indexOf(primary)]! : null,
    addressText: row.addressText,
    location: row.lat === null || row.lng === null ? null : { lat: row.lat, lng: row.lng },
    today: today ?? null,
    temporarilyClosed: row.temporarilyClosed ?? false,
    delivery: row.hasSettings ? {
      // Same completeness rule as checkout/owner settings (null checks only).
      enabled: deliveryConfigured({
        ...DEFAULT_SETTINGS,
        deliveryMethod: row.deliveryMethod as BusinessSettings['deliveryMethod'],
        deliveryRadiusKm: row.deliveryRadiusKm,
        deliveryFeePaise: row.deliveryFeePaise === null ? null : Number(row.deliveryFeePaise),
        minimumOrderPaise: row.minimumOrderPaise === null ? null : Number(row.minimumOrderPaise),
      }),
      radiusKm: row.deliveryRadiusKm,
    } : null,
    pickup: row.pickupEnabled ?? false,
    serviceArea: row.serviceArea,
    serviceRadiusKm: row.serviceRadiusKm,
    socialLinks: {
      instagramUrl: row.instagramUrl, facebookUrl: row.facebookUrl,
      websiteUrl: null, youtubeUrl: row.youtubeUrl,
    },
  };
}
