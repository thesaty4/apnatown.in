-- Public hero/promotion placements (S-CUST-01, F-HM-002/006/007).
-- The browser never reads promotion_placements directly: this view owns live
-- eligibility (active, in-window, public business target) and exposes only the
-- attached offer-banner image as a same-origin media gateway descriptor.
BEGIN;
-- Banner backgrounds reuse the existing `offer_banner` Settings policy; this
-- only widens the stored purpose list, it does not add an upload path.
ALTER TABLE media_assets DROP CONSTRAINT media_assets_purpose_check;
ALTER TABLE media_assets ADD CONSTRAINT media_assets_purpose_check
  CHECK (purpose IN ('catalog_taxonomy','product','service','business_profile','offer_banner','gallery','video_thumbnail'));

CREATE VIEW promotion_placements_public AS
  SELECT p.id,p.kind,p.surface,p.business_id,p.title_en,p.title_hi,
    p.subtitle_en,p.subtitle_hi,p.destination,p.position,
    p.scope_kind,p.city_id,p.area_id,p.starts_at,p.ends_at,
    a.id AS banner_asset_id,
    CASE WHEN a.id IS NULL THEN NULL ELSE jsonb_build_object(
      'width',(v.value->>'width')::integer,
      'height',(v.value->>'height')::integer,
      'bytes',(v.value->>'bytes')::integer,
      'mimeType','image/webp',
      'path','/api/media/public/'||a.id||'?placementType=promotion&placementId='||p.id||
        '&surface='||CASE WHEN p.surface='hero_banner' THEN 'home' ELSE 'detail' END||
        '&variantWidth='||(v.value->>'width')||'&assetVersion='||a.version
    ) END AS banner
  FROM promotion_placements p
  LEFT JOIN media_assets a ON a.id=p.banner_asset_id
    AND a.purpose='offer_banner' AND a.visibility='public'
    AND a.moderation_state='allowed' AND a.deleted_at IS NULL
    AND a.mime_type='image/webp'
  -- One token-budgeted hero variant: 1600px is the nearest useful width for a
  -- full-width banner without shipping the 1920px ceiling to every phone.
  LEFT JOIN LATERAL (
    SELECT value FROM jsonb_array_elements(a.variants) value
    ORDER BY abs((value->>'width')::integer - 1600) LIMIT 1
  ) v ON a.id IS NOT NULL
  WHERE p.status='active' AND p.deleted_at IS NULL
    AND p.activation_blocked_reason IS NULL
    AND (p.starts_at IS NULL OR p.starts_at<=transaction_timestamp())
    AND (p.ends_at IS NULL OR transaction_timestamp()<p.ends_at)
    AND (p.business_id IS NULL OR EXISTS (
      SELECT 1 FROM businesses_public_context b WHERE b.id=p.business_id));

GRANT SELECT ON promotion_placements_public TO apnatown_runtime;
COMMIT;
