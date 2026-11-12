-- Explore's kind/verified filters and stable created_at/id paging.
-- Category EXISTS uses business_categories_category_idx from Businesses.
-- Additive only: no rows or grants change. Repair with a reviewed forward
-- migration that recreates/drops these indexes; no row data is lost.
BEGIN;

CREATE INDEX businesses_discovery_page_idx
    ON businesses (kind, created_at, id)
    WHERE status = 'approved' AND deleted_at IS NULL
      AND name_en IS NOT NULL AND slug IS NOT NULL;

CREATE INDEX businesses_discovery_verified_page_idx
    ON businesses (kind, created_at, id)
    WHERE status = 'approved' AND deleted_at IS NULL
      AND name_en IS NOT NULL AND slug IS NOT NULL AND verified_at IS NOT NULL;

COMMIT;
