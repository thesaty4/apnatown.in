import { Prisma } from '../../../shared/persistence/generated/client';

/**
 * Media-owned Search projection, not a Reels rank snapshot. Search links open
 * /videos/:id, so require that surface's current Reels consent as well as live
 * business/city/taxonomy visibility. No provider request or view increment.
 * The owner's media order is deterministic; no invented relevance/view boost.
 */
export const videoSearchProjection = Prisma.sql`
  SELECT v.id,v.business_id,v.sort_order,v.caption,v.hashtags,v.source AS provider,
    b.slug AS business_slug,b.kind AS business_kind,b.name_en AS business_name_en,
    b.name_hi AS business_name_hi,b.city_id,b.area_id,v.view_count,
    ARRAY(SELECT p.id FROM video_links l JOIN products_public_discovery p
      ON p.id=l.target_id AND p.business_id=v.business_id
      WHERE l.video_id=v.id AND l.target_type='product' ORDER BY l.sort_order,p.id) AS product_ids,
    ARRAY(SELECT s.id FROM video_links l JOIN services_public_discovery s
      ON s.id=l.target_id AND s.business_id=v.business_id
      WHERE l.video_id=v.id AND l.target_type='service' ORDER BY l.sort_order,s.id) AS service_ids
  FROM videos v JOIN businesses_public_context b ON b.id=v.business_id
  WHERE v.status='approved' AND v.owner_deleted_at IS NULL AND v.show_in_reels`;

export const videoSearchCard = Prisma.sql`jsonb_build_object(
  'kind','video','id',v.id,'caption',v.caption,'hashtags',v.hashtags,'provider',v.provider,
  'business',jsonb_build_object('id',v.business_id,'slug',v.business_slug,'kind',v.business_kind,
    'nameEn',v.business_name_en,'nameHi',v.business_name_hi),
  'viewCount',v.view_count,'image',NULL,'durationSeconds',NULL,'path','/videos/'||v.id)`;
