import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type {
  BusinessProfileImageSource,
  BusinessProfileImageVariantRow,
} from '../application/business-profile-images.port';

/**
 * Media's single authorization predicate for public business logo/cover
 * delivery, shared by descriptor reads and the reauthorizing gateway. Like
 * `media_public_listing_images`, it reads Businesses' public visibility
 * (`businesses_public_context`: approved, non-deleted, active owner, enabled
 * city) plus the current attachment columns, and returns only safe variant
 * dimensions (no provider IDs or storage keys).
 */
export function businessProfileImageVariants(businessId: string, assetId: string | null = null): Prisma.Sql {
  return Prisma.sql`
    SELECT a.id::text AS "assetId",a.subject_type AS "subjectType",a.version AS "assetVersion",
      (v.value->>'width')::integer AS width,(v.value->>'height')::integer AS height,
      (v.value->>'bytes')::integer AS bytes
    FROM businesses_public_context b
    JOIN businesses profile ON profile.id=b.id
    JOIN media_assets a ON a.business_id=b.id AND a.owner_user_id=profile.owner_user_id
      AND ((a.subject_type='logo' AND a.id=profile.logo_asset_id)
        OR (a.subject_type='cover' AND a.id=profile.cover_asset_id))
    CROSS JOIN LATERAL jsonb_array_elements(a.variants) v(value)
    WHERE b.id=${businessId}::uuid AND (${assetId}::uuid IS NULL OR a.id=${assetId}::uuid)
      AND a.purpose='business_profile' AND a.visibility='public' AND a.moderation_state='allowed'
      AND a.deleted_at IS NULL AND a.mime_type='image/webp'`;
}

@Injectable()
export class PrismaBusinessProfileImageSource implements BusinessProfileImageSource {
  constructor(private readonly db: PrismaDatabase) {}
  variants(businessId: string): Promise<BusinessProfileImageVariantRow[]> {
    return this.db.queryRaw<BusinessProfileImageVariantRow[]>(businessProfileImageVariants(businessId));
  }
}
