-- Provider businesses are categorised by Services-owned SERVICE taxonomy
-- (prototype provider onboarding, js9.js wizard('service') uses SCATS), so the
-- PRODUCT-membership requirement now applies to shops only. Previously every
-- approved provider and all of its active services were excluded from public
-- discovery. Same column list; only the final predicate changes.
-- Recovery: a new reviewed migration can restore the previous predicate; no
-- rows are read-modified or removed. Existing grants are preserved by
-- CREATE OR REPLACE VIEW.
BEGIN;

CREATE OR REPLACE VIEW businesses_public_context AS
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
    AND u.account_status='active' AND u.deleted_at IS NULL
    AND (b.kind='provider' OR cardinality(cats.ids)>0);

COMMIT;
