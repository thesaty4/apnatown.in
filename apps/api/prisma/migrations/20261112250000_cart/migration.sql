-- Cart-checkout owns carts and cart lines (F-CK-001, S-CUST-10, J12; BE spec
-- tables `carts`/`cart_lines`). A cart belongs to exactly one owner: an
-- account (user_id) or an anonymous guest-cart capability persisted only as
-- the SHA-256 hash of an httpOnly opaque cookie token (never the token).
-- Lines store identity (product + nullable variant), quantity and the saved
-- flag only; prices, fees and stock are always re-read from Products' public
-- read port and never stored here. Cart never decrements inventory.
-- Runtime may create carts/lines, advance versions and line quantity/saved
-- state, and delete lines or a consumed guest cart; it can never rewrite a
-- cart's owner or a line's product/variant identity.
-- Recovery is forward repair only; dropping these tables loses customer
-- carts. Guest-cart lifetime is Q-70 configuration; the worker purges expired
-- guest carts (and, by cascade, their lines) in bounded batches.
-- No seed or backfill.
BEGIN;
CREATE TABLE carts (
  id uuid NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  guest_cart_token_hash bytea,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT carts_pkey PRIMARY KEY (id),
  CONSTRAINT carts_single_owner_check CHECK (num_nonnulls(user_id, guest_cart_token_hash) = 1),
  CONSTRAINT carts_guest_hash_length_check CHECK (guest_cart_token_hash IS NULL OR octet_length(guest_cart_token_hash) = 32),
  CONSTRAINT carts_version_positive CHECK (version >= 1)
);
-- One account cart per user; one cart per guest capability.
CREATE UNIQUE INDEX carts_user_key ON carts(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX carts_guest_cart_token_hash_key ON carts(guest_cart_token_hash);
-- Worker purge of expired guest carts (Q-70 lifetime), oldest first.
CREATE INDEX carts_guest_expiry_idx ON carts(updated_at, id) WHERE user_id IS NULL;

CREATE TABLE cart_lines (
  id uuid NOT NULL,
  cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE ON UPDATE RESTRICT,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  product_variant_id uuid REFERENCES product_variants(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  quantity smallint NOT NULL,
  saved_for_later boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT cart_lines_pkey PRIMARY KEY (id),
  CONSTRAINT cart_lines_quantity_range CHECK (quantity BETWEEN 1 AND 10),
  CONSTRAINT cart_lines_version_positive CHECK (version >= 1)
);
-- Stable line identity is product + nullable variant, independent of saved.
CREATE UNIQUE INDEX cart_lines_product_key ON cart_lines(cart_id, product_id)
  WHERE product_variant_id IS NULL;
CREATE UNIQUE INDEX cart_lines_variant_key ON cart_lines(cart_id, product_id, product_variant_id)
  WHERE product_variant_id IS NOT NULL;
-- Cart read order (active/saved sections, oldest first).
CREATE INDEX cart_lines_cart_order_idx ON cart_lines(cart_id, saved_for_later, created_at, id);
-- Foreign-key indexes (cart_id leads the indexes above).
CREATE INDEX cart_lines_product_idx ON cart_lines(product_id);
CREATE INDEX cart_lines_variant_idx ON cart_lines(product_variant_id) WHERE product_variant_id IS NOT NULL;

GRANT SELECT, INSERT, DELETE ON carts, cart_lines TO apnatown_runtime;
GRANT UPDATE (version, updated_at) ON carts TO apnatown_runtime;
GRANT UPDATE (quantity, saved_for_later, version, updated_at) ON cart_lines TO apnatown_runtime;
COMMIT;
