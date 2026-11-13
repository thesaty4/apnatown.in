-- Products/Services own these sources, not Search. No rows are seeded and no
-- manager/checkout write capability is granted by this read-contract migration.
-- Recovery: forward repair only; retain source rows. Dropping tables loses data.
BEGIN;
CREATE TABLE products (
  id uuid PRIMARY KEY, business_id uuid NOT NULL REFERENCES businesses(id),
  category_id uuid NOT NULL REFERENCES categories(id),
  subcategory_id uuid NOT NULL REFERENCES subcategories(id),
  slug text NOT NULL UNIQUE, name_en text NOT NULL, name_hi text, description text,
  brand text, sku text, price_paise bigint NOT NULL CHECK (price_paise BETWEEN 0 AND 9007199254740991),
  mrp_paise bigint NOT NULL CHECK (mrp_paise BETWEEN price_paise AND 9007199254740991),
  unit text NOT NULL, tags text[] NOT NULL DEFAULT '{}', specs jsonb NOT NULL DEFAULT '[]',
  tax_code text, featured_selected boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true, media jsonb NOT NULL DEFAULT '[]',
  version integer NOT NULL DEFAULT 1 CHECK (version > 0), deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_media_shape CHECK (jsonb_typeof(media) = 'array' AND jsonb_array_length(media) <= 5)
);
CREATE UNIQUE INDEX products_business_sku_key ON products(business_id,sku) WHERE sku IS NOT NULL;
CREATE INDEX products_business_page_idx ON products(business_id,created_at DESC,id DESC);
CREATE INDEX products_taxonomy_price_idx ON products(category_id,subcategory_id,price_paise,id) WHERE published AND deleted_at IS NULL;
CREATE INDEX products_subcategory_idx ON products(subcategory_id);
CREATE INDEX products_featured_page_idx ON products(category_id,featured_selected DESC,created_at DESC,id DESC) WHERE published AND deleted_at IS NULL;
CREATE INDEX products_brand_idx ON products(brand,id) WHERE published AND deleted_at IS NULL;
CREATE INDEX products_names_trgm_idx ON products USING gin(name_en gin_trgm_ops,name_hi gin_trgm_ops);
CREATE TABLE inventory (
  product_id uuid PRIMARY KEY REFERENCES products(id), on_hand integer NOT NULL CHECK (on_hand >= 0),
  low_stock_threshold integer NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  available_for_sale boolean NOT NULL DEFAULT true, version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX inventory_available_idx ON inventory(available_for_sale,on_hand,product_id);
CREATE TABLE services (
  id uuid PRIMARY KEY, business_id uuid NOT NULL REFERENCES businesses(id),
  category_id uuid NOT NULL REFERENCES categories(id), subcategory_id uuid NOT NULL REFERENCES subcategories(id),
  slug text NOT NULL UNIQUE, name_en text NOT NULL, name_hi text, description text,
  price_type text NOT NULL CHECK (price_type IN ('from','fixed','range','enquiry')),
  price_from_paise bigint CHECK (price_from_paise BETWEEN 0 AND 9007199254740991),
  price_to_paise bigint CHECK (price_to_paise BETWEEN price_from_paise AND 9007199254740991),
  unit text CHECK (unit IN ('hour','day','event','sq_ft','unit','visit','plate')),
  included text[] NOT NULL DEFAULT '{}', excluded text[] NOT NULL DEFAULT '{}',
  service_area text, experience_years integer CHECK (experience_years >= 0),
  media jsonb NOT NULL DEFAULT '[]', gallery_visible boolean NOT NULL,
  faqs jsonb NOT NULL DEFAULT '[]', featured_selected boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused')),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0), deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT services_price_shape CHECK (
    (price_type = 'enquiry' AND price_from_paise IS NULL AND price_to_paise IS NULL) OR
    (price_type IN ('from','fixed') AND price_from_paise IS NOT NULL AND price_to_paise IS NULL) OR
    (price_type = 'range' AND price_from_paise IS NOT NULL AND price_to_paise IS NOT NULL)),
  CONSTRAINT services_media_shape CHECK (jsonb_typeof(media) = 'array' AND jsonb_array_length(media) <= 5)
);
CREATE INDEX services_business_page_idx ON services(business_id,status,created_at DESC,id DESC);
CREATE INDEX services_taxonomy_price_idx ON services(category_id,subcategory_id,price_from_paise,id) WHERE status='active' AND deleted_at IS NULL;
CREATE INDEX services_subcategory_idx ON services(subcategory_id,business_id);
CREATE INDEX services_featured_page_idx ON services(category_id,featured_selected DESC,created_at DESC,id DESC) WHERE status='active' AND deleted_at IS NULL;
CREATE INDEX services_names_trgm_idx ON services USING gin(name_en gin_trgm_ops,name_hi gin_trgm_ops);
GRANT SELECT ON products,inventory,services TO apnatown_runtime;
COMMIT;
