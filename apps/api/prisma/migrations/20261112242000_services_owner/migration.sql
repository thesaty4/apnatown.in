-- Services owner manager (services BE spec; F-VD-014, F-PV-003). Owners
-- create services and edit only the allow-listed columns below: no business,
-- slug, id or experience_years rewrite and no hard delete (DELETE is a soft
-- delete through deleted_at). The partial index serves the unfiltered,
-- newest-first manager page; services_business_page_idx serves ?status=.
-- Recovery is forward repair only; no data is changed, seeded or backfilled.
BEGIN;
CREATE INDEX services_owner_page_idx
  ON services(business_id,created_at DESC,id DESC) WHERE deleted_at IS NULL;

GRANT INSERT ON services TO apnatown_runtime;
GRANT UPDATE (category_id, subcategory_id, name_en, name_hi, description, price_type,
  price_from_paise, price_to_paise, unit, included, excluded, service_area, media,
  gallery_visible, featured_selected, status, version, deleted_at, updated_at)
  ON services TO apnatown_runtime;
COMMIT;
