import type { DiscoveryLocation } from '@apnatown/shared/search';
import { Prisma } from './generated/client';

/**
 * Presentation of the owner-exported public column contract. This helper never
 * queries private owner tables or implements offer/review/entitlement rules.
 */
export function listingRows(source: Prisma.Sql, location: DiscoveryLocation | null = null) {
  const point = location ? Prisma.sql`ST_SetSRID(ST_MakePoint(
    ${location.longitude}::float8,${location.latitude}::float8),4326)::geography`
    : Prisma.sql`NULL::geography`;
  return Prisma.sql`
    SELECT x.*,b.verified,b.open_now,b.pickup,b.city_id,b.area_id,b.phone,
      b.slug AS business_slug,b.kind AS business_kind,b.name_en AS business_name_en,b.name_hi AS business_name_hi,
      b.area_name_en,b.area_name_hi,c.slug AS category_slug,c.name_en AS category_name_en,c.name_hi AS category_name_hi,
      sc.slug AS subcategory_slug,sc.name_en AS subcategory_name_en,sc.name_hi AS subcategory_name_hi,
      ST_Y(b.location::geometry) AS lat,ST_X(b.location::geometry) AS lng,
      ST_Distance(b.location,${point})/1000.0 AS distance_km,
      geo_discovery_delivers(b.location,${point},b.city_id,b.delivery_method,
        CASE WHEN x.kind='service' THEN b.service_radius_km ELSE b.delivery_radius_km END,x.kind='service') AS delivers,
      image.image,
      '/'||CASE x.kind WHEN 'product' THEN 'product' WHEN 'service' THEN 'service'
        ELSE CASE b.kind WHEN 'provider' THEN 'provider' ELSE 'shop' END END||'/'||x.slug AS path
    FROM (${source}) x JOIN businesses_public_context b ON b.id=x.business_id
    LEFT JOIN catalog_discovery_categories c ON c.id=x.category_ids[1]
    LEFT JOIN catalog_discovery_subcategories sc ON sc.id=x.subcategory_id
    LEFT JOIN LATERAL (SELECT m.image FROM media_public_listing_images m
      WHERE m.placement_id=x.id AND m.placement_type=CASE x.kind WHEN 'shop' THEN 'business' ELSE x.kind END
      ORDER BY m.position,(m.width<=640) DESC,m.width DESC LIMIT 1) image ON true`;
}

/** The caller supplies only rows of listingRows as alias x. */
export const listingCard = Prisma.sql`jsonb_build_object(
  'id',x.id,'kind',x.kind,'slug',x.slug,'nameEn',x.name_en,'nameHi',x.name_hi,
  'category',CASE WHEN x.category_slug IS NULL THEN NULL ELSE jsonb_build_object(
    'slug',x.category_slug,'nameEn',x.category_name_en,'nameHi',x.category_name_hi) END,
  'subcategory',CASE WHEN x.subcategory_slug IS NULL THEN NULL ELSE jsonb_build_object(
    'slug',x.subcategory_slug,'nameEn',x.subcategory_name_en,'nameHi',x.subcategory_name_hi) END,
  'area',CASE WHEN x.area_name_en IS NULL THEN NULL ELSE jsonb_build_object(
    'nameEn',x.area_name_en,'nameHi',x.area_name_hi) END,
  'business',jsonb_build_object('id',x.business_id,'slug',x.business_slug,'kind',x.business_kind,
    'nameEn',x.business_name_en,'nameHi',x.business_name_hi),
  'image',x.image,'rating',x.rating,'reviewCount',x.review_count,
  'pricePaise',x.price_paise,'mrpPaise',x.mrp_paise,'priceMaxPaise',x.price_max_paise,
  'priceType',x.price_type,'unit',x.unit,'distanceKm',x.distance_km,
  'verified',x.verified,'featured',x.featured,'openNow',x.open_now,'offers',x.offers,
  'inStock',x.in_stock,'pickup',x.pickup,'delivers',x.delivers,'path',x.path,'phone',x.phone)`;

export const listingPin = Prisma.sql`CASE WHEN x.kind='product' OR x.lat IS NULL OR x.lng IS NULL THEN NULL
  ELSE jsonb_build_object('id',x.business_id,'businessId',x.business_id,'lat',x.lat,'lng',x.lng,
    'nameEn',x.business_name_en,'nameHi',x.business_name_hi,'distanceKm',x.distance_km,'delivers',x.delivers,
    'path','/'||CASE x.business_kind WHEN 'provider' THEN 'provider' ELSE 'shop' END||'/'||x.business_slug) END`;
