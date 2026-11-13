-- Public owner read contracts. Ordinary (not materialized) views: no search
-- index, copied eligibility flags, jobs or source-of-truth Search tables.
-- All time-sensitive predicates share transaction_timestamp(). Forward repair
-- uses CREATE OR REPLACE VIEW; no source rows are modified by this migration.
BEGIN;

-- Existing Media storage identity/adapter is retained; no new upload contract.
ALTER TABLE media_assets DROP CONSTRAINT media_assets_purpose_check;
ALTER TABLE media_assets ADD CONSTRAINT media_assets_purpose_check
  CHECK (purpose IN ('catalog_taxonomy','product','service','business_profile'));

-- Catalog owns taxonomy and the ordered, directional context relationships.
CREATE VIEW catalog_discovery_categories AS
  SELECT id,kind,slug,name_en,name_hi,sort_order FROM categories WHERE active;
CREATE VIEW catalog_discovery_subcategories AS
  SELECT s.id,s.category_id,s.slug,s.name_en,s.name_hi,s.sort_order,c.kind
  FROM subcategories s JOIN catalog_discovery_categories c ON c.id=s.category_id WHERE s.active;
CREATE VIEW catalog_discovery_relations AS
  SELECT r.source_category_id,r.related_category_id,r.sort_order
  FROM category_relations r
  JOIN catalog_discovery_categories a ON a.id=r.source_category_id
  JOIN catalog_discovery_categories b ON b.id=r.related_category_id;

-- Reviews owns this aggregate. No invented provider rating or stale counter.
CREATE VIEW reviews_public_aggregates AS
  SELECT r.target_type,r.target_id,avg(r.rating)::float8 AS rating,count(*)::integer AS review_count
  FROM reviews r JOIN users u ON u.id=r.author_user_id
  WHERE r.status='published' AND r.deleted_at IS NULL
    AND u.account_status='active' AND u.deleted_at IS NULL
  GROUP BY r.target_type,r.target_id;

-- Payments: a selection is not entitlement. Only a verified finite paid period
-- with immutable configuration evidence can grant Premium. Legacy/null evidence
-- stays unavailable; no inference from plan label, today's settings or amount.
CREATE VIEW payments_featured_eligibility AS
  SELECT s.business_id,v.version
  FROM business_subscriptions s JOIN business_subscription_versions v ON v.business_id=s.business_id
  JOIN billing_purchases p ON p.id=s.purchase_id AND p.business_id=s.business_id
  WHERE p.kind='plan' AND p.status='succeeded' AND p.target_key=s.plan_key
    AND length(p.configuration_version)>0
    AND p.configuration_snapshot @> '{"premium":true}'::jsonb
    AND p.configuration_snapshot ?& ARRAY['commissionBps','periodRules','taxSnapshot']
    AND jsonb_typeof(p.configuration_snapshot->'taxSnapshot')='object'
    AND p.configuration_snapshot->'taxSnapshot' <> '{}'::jsonb
    AND s.plan_snapshot @> '{"premium":true}'::jsonb
    AND s.plan_snapshot->>'planKey'=s.plan_key
    AND s.plan_snapshot->'commissionBps'=p.configuration_snapshot->'commissionBps'
    AND s.starts_at<=transaction_timestamp() AND transaction_timestamp()<s.ends_at;

-- Businesses: complete public visibility, PRODUCT-kind memberships, and
-- server-authoritative IST hours (including yesterday's overnight interval).
CREATE VIEW businesses_public_context AS
  SELECT b.id,b.kind,b.slug,b.name_en,b.name_hi,b.description,b.city_id,b.area_id,
    a.name_en AS area_name_en,a.name_hi AS area_name_hi,b.location,b.logo_asset_id,b.phone_e164 AS phone,
    b.verified_at IS NOT NULL AS verified,b.created_at,b.updated_at,
    cats.ids AS category_ids,coalesce(bs.pickup_enabled,false) AS pickup,
    bs.delivery_method,bs.delivery_radius_km,bs.service_radius_km,
    CASE WHEN bs.temporarily_closed THEN false WHEN hours.total<>7 THEN NULL
      ELSE hours.is_open END AS open_now
  FROM businesses b JOIN users u ON u.id=b.owner_user_id
  JOIN cities city ON city.id=b.city_id AND city.status='enabled'
  LEFT JOIN areas a ON a.id=b.area_id AND a.city_id=b.city_id
  LEFT JOIN business_settings bs ON bs.business_id=b.id
  CROSS JOIN LATERAL (
    SELECT array_agg(c.id ORDER BY bc.is_primary DESC,c.sort_order,c.id) AS ids
    FROM business_categories bc JOIN catalog_discovery_categories c ON c.id=bc.category_id AND c.kind='product'
    WHERE bc.business_id=b.id
  ) cats
  CROSS JOIN LATERAL (
    SELECT count(*) AS total,coalesce(bool_or(NOT h.is_closed AND (
      (h.day_of_week=extract(dow FROM transaction_timestamp() AT TIME ZONE 'Asia/Kolkata')
        AND (transaction_timestamp() AT TIME ZONE 'Asia/Kolkata')::time>=h.opens_at
        AND (h.closes_at<h.opens_at OR (transaction_timestamp() AT TIME ZONE 'Asia/Kolkata')::time<h.closes_at))
      OR (h.day_of_week=(extract(dow FROM transaction_timestamp() AT TIME ZONE 'Asia/Kolkata')::integer+6)%7
        AND h.closes_at<h.opens_at AND (transaction_timestamp() AT TIME ZONE 'Asia/Kolkata')::time<h.closes_at)
    )),false) AS is_open FROM business_hours h WHERE h.business_id=b.id
  ) hours
  WHERE b.status='approved' AND b.deleted_at IS NULL AND b.slug IS NOT NULL AND b.name_en IS NOT NULL
    AND u.account_status='active' AND u.deleted_at IS NULL AND cardinality(cats.ids)>0;

-- Offers owns approval/window/stock eligibility and best-price selection.
CREATE VIEW offers_public_active AS
  SELECT o.* FROM offers o JOIN businesses_public_context b ON b.id=o.business_id
  WHERE o.status='active' AND o.review_decision='approved' AND o.reviewed_at IS NOT NULL
    AND o.valid_from<=transaction_timestamp() AND transaction_timestamp()<o.valid_to;
CREATE VIEW offers_public_product_prices AS
  SELECT p.id AS product_id,o.id AS offer_id,
    CASE o.discount_type
      WHEN 'percent' THEN greatest(0,p.price_paise-(p.price_paise*o.discount_percent+50)/100)
      WHEN 'flat' THEN greatest(0,p.price_paise-o.discount_paise)
      ELSE p.price_paise END AS price_paise
  FROM products p JOIN inventory i ON i.product_id=p.id AND i.available_for_sale AND i.on_hand>0
  JOIN offers_public_active o ON o.business_id=p.business_id
  WHERE p.published AND p.deleted_at IS NULL AND
    (o.scope='business' OR EXISTS (SELECT 1 FROM offer_targets t
      WHERE t.offer_id=o.id AND t.product_id=p.id AND t.target_kind='product'));
CREATE VIEW offers_public_service_targets AS
  SELECT s.id AS service_id,o.id AS offer_id FROM services s
  JOIN offers_public_active o ON o.business_id=s.business_id
  WHERE s.status='active' AND s.deleted_at IS NULL AND
    (o.scope='business' OR EXISTS (SELECT 1 FROM offer_targets t
      WHERE t.offer_id=o.id AND t.service_id=s.id AND t.target_kind='service'));
CREATE VIEW offers_public_featured_businesses AS
  SELECT DISTINCT p.business_id FROM promotion_placements p
  JOIN businesses_public_context b ON b.id=p.business_id
  LEFT JOIN billing_purchases purchase ON purchase.id=p.purchase_id AND purchase.business_id=p.business_id
  WHERE p.kind='featured_business' AND p.surface='featured_business'
    AND p.status='active' AND p.deleted_at IS NULL AND p.activation_blocked_reason IS NULL
    AND (p.starts_at<=transaction_timestamp() OR (p.source='admin' AND p.starts_at IS NULL))
    AND (transaction_timestamp()<p.ends_at OR (p.source='admin' AND p.ends_at IS NULL))
    AND (p.scope_kind='platform' OR (p.city_id=b.city_id AND
      (p.scope_kind='city' OR p.area_id=b.area_id)))
    AND (p.source='admin' OR (purchase.status='succeeded' AND purchase.kind='promotion'
      AND purchase.prepared_placement_id=p.id AND length(p.configuration_version)>0));

CREATE VIEW products_public_discovery AS
  SELECT p.id,p.business_id,'product'::text AS kind,p.slug,p.name_en,p.name_hi,p.description,
    ARRAY[p.category_id] AS category_ids,p.subcategory_id,p.brand,
    coalesce(o.price_paise,p.price_paise) AS price_paise,p.mrp_paise,NULL::bigint AS price_max_paise,'fixed'::text AS price_type,p.unit,
    p.featured_selected AND EXISTS(SELECT 1 FROM payments_featured_eligibility e WHERE e.business_id=b.id) AS featured,
    coalesce(cardinality(o.ids)>0,false) AS offers,coalesce(o.ids,'{}'::uuid[]) AS offer_ids,
    r.rating,coalesce(r.review_count,0) AS review_count,
    CASE WHEN i.product_id IS NULL THEN NULL ELSE i.available_for_sale AND i.on_hand>0 END AS in_stock,
    p.created_at,p.media,p.tags
  FROM products p JOIN businesses_public_context b ON b.id=p.business_id
  JOIN catalog_discovery_categories c ON c.id=p.category_id AND c.kind='product'
  JOIN catalog_discovery_subcategories sc ON sc.id=p.subcategory_id AND sc.category_id=c.id
  LEFT JOIN inventory i ON i.product_id=p.id
  LEFT JOIN reviews_public_aggregates r ON r.target_type='product' AND r.target_id=p.id
  LEFT JOIN LATERAL (SELECT min(price_paise) AS price_paise,array_agg(offer_id ORDER BY offer_id) AS ids
    FROM offers_public_product_prices WHERE product_id=p.id) o ON true
  WHERE p.published AND p.deleted_at IS NULL;

CREATE VIEW services_public_discovery AS
  SELECT s.id,s.business_id,'service'::text AS kind,s.slug,s.name_en,s.name_hi,s.description,
    ARRAY[s.category_id] AS category_ids,s.subcategory_id,NULL::text AS brand,
    s.price_from_paise AS price_paise,NULL::bigint AS mrp_paise,s.price_to_paise AS price_max_paise,s.price_type,s.unit,
    s.featured_selected AND EXISTS(SELECT 1 FROM payments_featured_eligibility e WHERE e.business_id=b.id) AS featured,
    coalesce(cardinality(o.ids)>0,false) AS offers,coalesce(o.ids,'{}'::uuid[]) AS offer_ids,
    r.rating,coalesce(r.review_count,0) AS review_count,NULL::boolean AS in_stock,s.created_at,s.media,'{}'::text[] AS tags
  FROM services s JOIN businesses_public_context b ON b.id=s.business_id
  JOIN catalog_discovery_categories c ON c.id=s.category_id AND c.kind='service'
  JOIN catalog_discovery_subcategories sc ON sc.id=s.subcategory_id AND sc.category_id=c.id
  LEFT JOIN reviews_public_aggregates r ON r.target_type='service' AND r.target_id=s.id
  LEFT JOIN LATERAL (SELECT array_agg(offer_id ORDER BY offer_id) AS ids
    FROM offers_public_service_targets WHERE service_id=s.id) o ON true
  WHERE s.status='active' AND s.deleted_at IS NULL;

CREATE VIEW businesses_public_discovery AS
  SELECT b.id,b.id AS business_id,'shop'::text AS kind,b.slug,b.name_en,b.name_hi,b.description,
    b.category_ids,NULL::uuid AS subcategory_id,NULL::text AS brand,
    NULL::bigint AS price_paise,NULL::bigint AS mrp_paise,NULL::bigint AS price_max_paise,NULL::text AS price_type,NULL::text AS unit,
    EXISTS(SELECT 1 FROM offers_public_featured_businesses f WHERE f.business_id=b.id) AS featured,
    cardinality(o.ids)>0 AS offers,o.ids AS offer_ids,
    r.rating,coalesce(r.review_count,0) AS review_count,NULL::boolean AS in_stock,b.created_at,
    CASE WHEN b.logo_asset_id IS NULL THEN '[]'::jsonb
      ELSE jsonb_build_array(jsonb_build_object('assetId',b.logo_asset_id)) END AS media,'{}'::text[] AS tags
  FROM businesses_public_context b
  LEFT JOIN reviews_public_aggregates r ON r.target_type='business' AND r.target_id=b.id
  CROSS JOIN LATERAL (SELECT ARRAY(
    SELECT o.id FROM offers_public_active o WHERE o.business_id=b.id AND (
      EXISTS (SELECT 1 FROM offers_public_product_prices op JOIN products_public_discovery p ON p.id=op.product_id WHERE op.offer_id=o.id)
      OR EXISTS (SELECT 1 FROM offers_public_service_targets os JOIN services_public_discovery s ON s.id=os.service_id WHERE os.offer_id=o.id))
    ORDER BY o.id) AS ids) o;

-- Geo owns point/radius/zone serviceability. Null means missing authoritative
-- configuration/context, never a guessed false/true eligibility flag.
CREATE FUNCTION geo_discovery_delivers(
  business_location geography, customer_location geography, city uuid,
  method text, radius numeric, is_service boolean
) RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT CASE WHEN customer_location IS NULL OR business_location IS NULL OR radius IS NULL THEN NULL
    WHEN NOT is_service AND method IS NULL THEN NULL
    WHEN NOT ST_DWithin(business_location,customer_location,radius*1000) THEN false
    WHEN is_service OR method='self' THEN true
    WHEN method='apna_town_rider' THEN EXISTS (
      SELECT 1 FROM zones z WHERE z.city_id=city AND z.status='active'
        AND ST_Covers(z.polygon,customer_location::geometry)
        AND EXISTS(SELECT 1 FROM zone_fee_slabs f WHERE f.zone_id=z.id))
    ELSE NULL END;
$$;

-- Media owns attachment authorization. Descriptors contain only the existing
-- same-origin reauthorizing gateway path; provider metadata stays private.
CREATE VIEW media_public_listing_images AS
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
    AND a.visibility='public' AND a.moderation_state='allowed'
    AND a.deleted_at IS NULL AND a.mime_type='image/webp';

GRANT SELECT ON catalog_discovery_categories,catalog_discovery_subcategories,catalog_discovery_relations,
  reviews_public_aggregates,payments_featured_eligibility,businesses_public_context,
  offers_public_active,offers_public_product_prices,offers_public_service_targets,
  offers_public_featured_businesses,products_public_discovery,services_public_discovery,
  businesses_public_discovery,media_public_listing_images TO apnatown_runtime;
REVOKE ALL ON FUNCTION geo_discovery_delivers(geography,geography,uuid,text,numeric,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION geo_discovery_delivers(geography,geography,uuid,text,numeric,boolean) TO apnatown_runtime;
COMMIT;
