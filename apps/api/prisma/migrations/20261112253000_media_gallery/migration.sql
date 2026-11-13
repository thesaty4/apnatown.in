-- Media Gallery manager, public business Gallery/Videos, linked videos and
-- photo reports (Media BE spec: endpoints F-PF-009/010, F-PD-005, F-SV-004,
-- F-VD-012; tables gallery_photos, video_links, media_reports).
-- * `gallery` and `video_thumbnail` become stored owner purposes. Settings
--   already seeds both image policies (20261112060000); no settings change.
-- * gallery_photos: gallery-only owner photos; soft-deleted so report
--   placement IDs stay resolvable for moderation history.
-- * media_manager_orders: optimistic version per (business, manager list);
--   item order itself is stored in gallery_photos/videos.sort_order.
-- * videos.thumbnail_asset_id: optional own `video_thumbnail` asset.
-- * Open photo reports are deduplicated per (asset, placement, subject).
-- * Public read views recheck business publication, asset moderation and
--   per-placement consent at read time; browsers never receive storage refs
--   (the API builds same-origin gateway paths from these rows).
--   Service Gallery consent needs services.gallery_visible, which the
--   services public view does not project, so this view reads that one
--   column (Media cannot import the Services port: Services imports Media).
-- No backfill or seed: no gallery/thumbnail rows exist before this change.
-- Runtime grants are column-scoped so identity/ownership columns cannot be
-- rewritten. Recovery is forward repair only.
BEGIN;

ALTER TABLE media_assets DROP CONSTRAINT media_assets_purpose_check;
ALTER TABLE media_assets ADD CONSTRAINT media_assets_purpose_check
  CHECK (purpose IN ('catalog_taxonomy','product','service','business_profile','gallery','video_thumbnail'));
ALTER TABLE media_assets DROP CONSTRAINT media_assets_owner_business_pairing;
ALTER TABLE media_assets ADD CONSTRAINT media_assets_owner_business_pairing
  CHECK ((purpose IN ('product','service','business_profile','gallery','video_thumbnail')) = (business_id IS NOT NULL));

CREATE TABLE gallery_photos (
  id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  media_asset_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  caption text,
  linked_target_type text,
  linked_target_id uuid,
  sort_order integer NOT NULL DEFAULT 0,
  version integer NOT NULL DEFAULT 1,
  deleted_at timestamptz(6),
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT gallery_photos_pkey PRIMARY KEY (id),
  CONSTRAINT gallery_photos_caption_length CHECK (caption IS NULL OR char_length(caption) BETWEEN 1 AND 200),
  CONSTRAINT gallery_photos_link_type_allowed CHECK (linked_target_type IS NULL OR linked_target_type IN ('product','service')),
  CONSTRAINT gallery_photos_link_pairing CHECK ((linked_target_type IS NULL) = (linked_target_id IS NULL)),
  CONSTRAINT gallery_photos_sort_order_nonnegative CHECK (sort_order >= 0),
  CONSTRAINT gallery_photos_version_positive CHECK (version >= 1)
);
-- One live gallery placement per asset; a deleted placement frees the asset.
CREATE UNIQUE INDEX gallery_photos_live_asset_key
  ON gallery_photos(media_asset_id) WHERE deleted_at IS NULL;
CREATE INDEX gallery_photos_business_order_idx
  ON gallery_photos(business_id, sort_order, id) WHERE deleted_at IS NULL;
CREATE INDEX gallery_photos_linked_target_idx
  ON gallery_photos(linked_target_type, linked_target_id) WHERE linked_target_id IS NOT NULL;

CREATE TABLE media_manager_orders (
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  list_kind text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  updated_at timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT media_manager_orders_pkey PRIMARY KEY (business_id, list_kind),
  CONSTRAINT media_manager_orders_list_kind_allowed CHECK (list_kind IN ('videos','gallery')),
  CONSTRAINT media_manager_orders_version_positive CHECK (version >= 1)
);

ALTER TABLE videos ADD COLUMN thumbnail_asset_id uuid
  REFERENCES media_assets(id) ON DELETE RESTRICT ON UPDATE RESTRICT;
CREATE INDEX videos_thumbnail_asset_idx ON videos(thumbnail_asset_id) WHERE thumbnail_asset_id IS NOT NULL;

CREATE UNIQUE INDEX media_reports_open_photo_subject_key
  ON media_reports (asset_id, placement_type, placement_id, reporter_subject_hash)
  WHERE target_kind = 'photo' AND status = 'open';

-- Approved, non-owner-deleted videos of a public business. The thumbnail is
-- projected only while it is an allowed own `video_thumbnail` asset.
CREATE VIEW media_public_videos AS
  SELECT v.id,v.business_id,v.source,v.provider_kind,v.provider_video_id,v.caption,v.hashtags,
    v.show_in_gallery,v.show_in_reels,v.sort_order,v.view_count,v.created_at,
    t.id AS thumbnail_asset_id,t.version AS thumbnail_version,t.width AS thumbnail_width,
    t.height AS thumbnail_height,t.variants AS thumbnail_variants
  FROM videos v JOIN businesses_public_context b ON b.id=v.business_id
  LEFT JOIN media_assets t ON t.id=v.thumbnail_asset_id AND t.purpose='video_thumbnail'
    AND t.business_id=v.business_id AND t.visibility='public' AND t.moderation_state='allowed'
    AND t.deleted_at IS NULL AND t.mime_type='image/webp'
  WHERE v.status='approved' AND v.owner_deleted_at IS NULL;

-- Public Gallery: rank_group 0 gallery photos (owner order), 1 Gallery
-- videos (owner order), 2 consented product/service images. Keyset order is
-- (rank_group, rank_order, rank_key). linked_target_* (only while the target
-- is public) drives the product/service filters and the linked-item chip.
CREATE VIEW media_public_gallery_items AS
  SELECT gp.business_id,0 AS rank_group,gp.sort_order AS rank_order,gp.id::text AS rank_key,
    'photo'::text AS item_kind,'gallery_photo'::text AS placement_type,gp.id AS placement_id,
    a.id AS asset_id,NULL::uuid AS video_id,a.version AS asset_version,a.width,a.height,a.variants,
    gp.caption,
    CASE WHEN lp.id IS NOT NULL OR ls.id IS NOT NULL THEN gp.linked_target_type END AS linked_target_type,
    CASE WHEN lp.id IS NOT NULL OR ls.id IS NOT NULL THEN gp.linked_target_id END AS linked_target_id
  FROM gallery_photos gp JOIN businesses_public_context b ON b.id=gp.business_id
  JOIN media_assets a ON a.id=gp.media_asset_id AND a.purpose='gallery' AND a.business_id=gp.business_id
    AND a.visibility='public' AND a.moderation_state='allowed' AND a.deleted_at IS NULL AND a.mime_type='image/webp'
  LEFT JOIN products_public_discovery lp ON gp.linked_target_type='product'
    AND lp.id=gp.linked_target_id AND lp.business_id=gp.business_id
  LEFT JOIN services_public_discovery ls ON gp.linked_target_type='service'
    AND ls.id=gp.linked_target_id AND ls.business_id=gp.business_id
  WHERE gp.deleted_at IS NULL
  UNION ALL
  SELECT v.business_id,1,v.sort_order,v.id::text,'video',NULL::text,NULL::uuid,NULL::uuid,v.id,
    NULL::integer,NULL::integer,NULL::integer,NULL::jsonb,v.caption,NULL::text,NULL::uuid
  FROM media_public_videos v WHERE v.show_in_gallery
  UNION ALL
  SELECT p.business_id,2,0,'product:'||p.id::text||':'||lpad(item.ordinality::text,3,'0'),
    'photo','product_image',p.id,a.id,NULL::uuid,a.version,a.width,a.height,a.variants,NULL::text,'product',p.id
  FROM products_public_discovery p
  CROSS JOIN LATERAL jsonb_array_elements(p.media) WITH ORDINALITY item(value,ordinality)
  JOIN media_assets a ON a.id::text=item.value->>'assetId' AND a.purpose='product' AND a.business_id=p.business_id
    AND a.visibility='public' AND a.moderation_state='allowed' AND a.deleted_at IS NULL AND a.mime_type='image/webp'
  WHERE item.value->'showInGallery'='true'::jsonb
  UNION ALL
  SELECT sp.business_id,2,0,'service:'||sp.id::text||':'||lpad(item.ordinality::text,3,'0'),
    'photo','service_image',sp.id,a.id,NULL::uuid,a.version,a.width,a.height,a.variants,NULL::text,'service',sp.id
  FROM services_public_discovery sp JOIN services s ON s.id=sp.id AND s.gallery_visible
  CROSS JOIN LATERAL jsonb_array_elements(sp.media) WITH ORDINALITY item(value,ordinality)
  JOIN media_assets a ON a.id::text=item.value->>'assetId' AND a.purpose='service' AND a.business_id=sp.business_id
    AND a.visibility='public' AND a.moderation_state='allowed' AND a.deleted_at IS NULL AND a.mime_type='image/webp'
  WHERE item.value->'showInGallery'='true'::jsonb;

GRANT SELECT, INSERT ON gallery_photos TO apnatown_runtime;
GRANT UPDATE (caption, linked_target_type, linked_target_id, sort_order, version, deleted_at, updated_at)
  ON gallery_photos TO apnatown_runtime;
GRANT SELECT, INSERT ON media_manager_orders TO apnatown_runtime;
GRANT UPDATE (version, updated_at) ON media_manager_orders TO apnatown_runtime;
-- Owner link replacement (delete + insert inside the versioned video edit).
GRANT INSERT, DELETE ON video_links TO apnatown_runtime;
GRANT SELECT ON media_public_videos, media_public_gallery_items TO apnatown_runtime;

COMMIT;
