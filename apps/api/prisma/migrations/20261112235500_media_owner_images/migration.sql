-- Owner public-purpose image uploads (Media BE spec `media_assets`,
-- "Canonical AssetPort and consumers"). Product/service/business-profile
-- assets record the business they were uploaded for; business-profile assets
-- also record whether they are a logo or a cover so a cover can never be
-- attached as a logo (different minimum sizes/variants) and vice versa.
-- Taxonomy assets stay global (no business). No prior owner-purpose rows
-- exist (the only previous upload path wrote `catalog_taxonomy`), so the
-- pairing checks validate immediately; nothing is backfilled or seeded.
-- Runtime access: the table-level SELECT/INSERT grant (20261112100000) covers
-- the added columns. The table-wide UPDATE grant is narrowed to the
-- lifecycle columns so identity/ownership columns (owner_user_id,
-- business_id, purpose, subject_type, storage_key) can never be rewritten;
-- column UPDATE still permits the FOR SHARE locks used on attach. No new
-- table/view is created. Recovery is forward repair only.
BEGIN;
REVOKE UPDATE ON media_assets FROM apnatown_runtime;
GRANT UPDATE (moderation_state, version, deleted_at) ON media_assets TO apnatown_runtime;
ALTER TABLE media_assets
  ADD COLUMN business_id uuid REFERENCES businesses(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD COLUMN subject_type text;
ALTER TABLE media_assets ADD CONSTRAINT media_assets_owner_business_pairing
  CHECK ((purpose IN ('product','service','business_profile')) = (business_id IS NOT NULL));
-- NULL-safe: a business_profile row without a subject fails the check.
ALTER TABLE media_assets ADD CONSTRAINT media_assets_profile_subject_pairing
  CHECK (CASE WHEN purpose = 'business_profile'
              THEN subject_type IS NOT NULL AND subject_type IN ('logo','cover')
              ELSE subject_type IS NULL END);
CREATE INDEX media_assets_business_id_purpose_created_at_id_idx
  ON media_assets(business_id, purpose, created_at DESC, id DESC);
-- Defense in depth: public listing images must also belong to the placement's
-- business (not only its owner). Same columns/order, so existing grants stay.
CREATE OR REPLACE VIEW media_public_listing_images AS
  WITH placements AS (
    SELECT 'product'::text AS placement_type,id AS placement_id,business_id,media FROM products_public_discovery
    UNION ALL SELECT 'service',id,business_id,media FROM services_public_discovery
    UNION ALL SELECT 'business',id,business_id,media FROM businesses_public_discovery
  )
  SELECT p.placement_type,p.placement_id,a.id AS asset_id,a.version AS asset_version,
    item.ordinality AS position,(v.value->>'width')::integer AS width,
    jsonb_build_object('width',(v.value->>'width')::integer,'height',(v.value->>'height')::integer,
      'bytes',(v.value->>'bytes')::integer,'mimeType','image/webp',
      'path','/api/media/public/'||a.id||'?placementType='||p.placement_type||
        '&placementId='||p.placement_id||'&surface=card&variantWidth='||(v.value->>'width')||
        '&assetVersion='||a.version) AS image
  FROM placements p CROSS JOIN LATERAL jsonb_array_elements(p.media) WITH ORDINALITY item(value,ordinality)
  JOIN media_assets a ON a.id::text=item.value->>'assetId'
  JOIN businesses b ON b.id=p.business_id AND b.owner_user_id=a.owner_user_id
  CROSS JOIN LATERAL jsonb_array_elements(a.variants) v(value)
  WHERE a.purpose=CASE p.placement_type WHEN 'business' THEN 'business_profile' ELSE p.placement_type END
    AND a.business_id=p.business_id
    AND a.visibility='public' AND a.moderation_state='allowed'
    AND a.deleted_at IS NULL AND a.mime_type='image/webp';
COMMIT;
