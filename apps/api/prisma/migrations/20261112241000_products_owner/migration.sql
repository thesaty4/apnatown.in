-- Products owner manager (products BE spec tables product_variants and
-- product_category_pills; F-VD-004/005/009, F-PV-005). Variants are
-- selectable labels (Q-44): price and stock stay product-level. Referenced
-- variants are deactivated, never hard-deleted, so the partial uniques cover
-- active rows only. Pill preferences change only customer-facing product
-- pills; taxonomy rows are never written.
-- Runtime grants: owners create products/inventory and edit only the
-- allow-listed columns below (no business/slug/id rewrite, no hard delete of
-- products or inventory). Pills are replace-all (DELETE + INSERT).
-- Recovery is forward repair only; dropping these tables loses owner-entered
-- variant labels and pill preferences. No seed or backfill: absent pill rows
-- mean catalog defaults, absent variant rows mean a product without variants.
BEGIN;
CREATE TABLE product_variants (
  id uuid PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  label text NOT NULL CHECK (length(label) BETWEEN 1 AND 60),
  position integer NOT NULL CHECK (position >= 0),
  active boolean NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX product_variants_active_label_key
  ON product_variants(product_id,label) WHERE active;
CREATE UNIQUE INDEX product_variants_active_position_key
  ON product_variants(product_id,position) WHERE active;
CREATE INDEX product_variants_product_order_idx
  ON product_variants(product_id,active,position);

CREATE TABLE product_category_pills (
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  subcategory_id uuid NOT NULL REFERENCES subcategories(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  position integer NOT NULL CHECK (position >= 0),
  label_en text,
  label_hi text,
  hidden boolean NOT NULL DEFAULT false,
  CONSTRAINT product_category_pills_pkey PRIMARY KEY (business_id,subcategory_id),
  CONSTRAINT product_category_pills_business_position_key UNIQUE (business_id,position)
);
CREATE INDEX product_category_pills_subcategory_idx
  ON product_category_pills(subcategory_id);

GRANT SELECT, INSERT ON product_variants TO apnatown_runtime;
GRANT UPDATE (label, position, active) ON product_variants TO apnatown_runtime;
GRANT SELECT, INSERT, DELETE ON product_category_pills TO apnatown_runtime;
GRANT INSERT ON products, inventory TO apnatown_runtime;
GRANT UPDATE (category_id, subcategory_id, name_en, name_hi, description, brand, sku,
  price_paise, mrp_paise, unit, tags, specs, featured_selected, published, media,
  version, deleted_at, updated_at) ON products TO apnatown_runtime;
GRANT UPDATE (on_hand, low_stock_threshold, available_for_sale, version, updated_at)
  ON inventory TO apnatown_runtime;
COMMIT;
