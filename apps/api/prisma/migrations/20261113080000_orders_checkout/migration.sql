-- Orders MVP slice: server-priced checkout quotes/attempts (cart-checkout),
-- per-shop cash allocations (payments, COD only), per-shop orders with
-- immutable purchase snapshots, append-only status history and durable stock
-- allocation/operation records (orders), and customer handover codes
-- (delivery). Specs: specs/cart-checkout/be/cart-checkout.md "Tables",
-- specs/orders/be/orders.md "Tables", specs/payments/be/payments.md
-- `payment_attempts` + cash collection columns, specs/delivery/be/delivery.md
-- `delivery_codes`.
-- Deliberately not created here (documented gaps): order_adjustments,
-- order_cases/events/attachments, master_checkout_summaries(+_orders),
-- order_billing_documents/invoice counters, payment_charges, refunds,
-- payment_compensations, delivery_jobs/offers.
-- Money is bigint paise bounded to 2^53-1 (safe JSON integers); instants UTC.
-- Handover codes are stored only as a keyed HMAC plus AES-GCM ciphertext
-- (keys outside the DB); never plaintext.
-- No backfill: no rows exist before this change. Recovery is forward repair
-- only; dropping these tables destroys order, payment and stock history.
BEGIN;

CREATE TABLE checkout_quotes (
  id uuid NOT NULL,
  cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  user_id uuid REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  cart_version integer NOT NULL,
  address_id uuid REFERENCES addresses(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  address_version integer,
  input_hash text NOT NULL,
  pricing_revision text NOT NULL,
  snapshot jsonb NOT NULL,
  created_at timestamptz(6) NOT NULL,
  expires_at timestamptz(6) NOT NULL,
  CONSTRAINT checkout_quotes_pkey PRIMARY KEY (id),
  CONSTRAINT checkout_quotes_address_pairing CHECK ((address_id IS NULL) = (address_version IS NULL)),
  CONSTRAINT checkout_quotes_expiry_after_creation CHECK (expires_at > created_at),
  CONSTRAINT checkout_quotes_cart_version_positive CHECK (cart_version >= 1),
  CONSTRAINT checkout_quotes_snapshot_object CHECK (jsonb_typeof(snapshot) = 'object')
);
CREATE INDEX checkout_quotes_cart_current_idx
  ON checkout_quotes (cart_id, cart_version, created_at DESC, id DESC);
CREATE INDEX checkout_quotes_expires_at_idx ON checkout_quotes (expires_at);
CREATE INDEX checkout_quotes_user_idx ON checkout_quotes (user_id);
CREATE INDEX checkout_quotes_address_idx ON checkout_quotes (address_id) WHERE address_id IS NOT NULL;

CREATE TABLE checkout_attempts (
  id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  quote_id uuid NOT NULL REFERENCES checkout_quotes(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  idempotency_key text NOT NULL,
  request_hash text NOT NULL,
  status text NOT NULL,
  payment_method text NOT NULL,
  payment_round integer NOT NULL DEFAULT 1,
  failure_code text,
  invalidated_at timestamptz(6),
  expires_at timestamptz(6) NOT NULL,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz(6) NOT NULL,
  updated_at timestamptz(6) NOT NULL,
  CONSTRAINT checkout_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT checkout_attempts_status_check CHECK (status IN ('created','payment_pending',
    'payment_failed','placed','expired','compensating','compensated','reconciliation_required')),
  CONSTRAINT checkout_attempts_payment_method_check CHECK (payment_method IN
    ('upi','card','net_banking','wallet','cash','no_charge')),
  CONSTRAINT checkout_attempts_round_positive CHECK (payment_round >= 1),
  CONSTRAINT checkout_attempts_version_positive CHECK (version >= 1),
  CONSTRAINT checkout_attempts_user_key_unique UNIQUE (user_id, idempotency_key)
);
-- One unplaced/in-flight attempt fences a cart.
CREATE UNIQUE INDEX checkout_attempts_cart_open_key ON checkout_attempts (cart_id)
  WHERE status IN ('created','payment_pending','compensating','reconciliation_required');
CREATE INDEX checkout_attempts_user_page_idx ON checkout_attempts (user_id, created_at DESC, id DESC);
CREATE INDEX checkout_attempts_status_expiry_idx ON checkout_attempts (status, expires_at);
CREATE INDEX checkout_attempts_quote_idx ON checkout_attempts (quote_id);

CREATE TABLE payment_attempts (
  id uuid NOT NULL,
  checkout_attempt_id uuid REFERENCES checkout_attempts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  quote_id uuid REFERENCES checkout_quotes(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  payment_round integer,
  order_id uuid,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  initiated_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  purpose text NOT NULL,
  amount_paise bigint NOT NULL,
  current_payable_paise bigint NOT NULL,
  funded_paise bigint NOT NULL DEFAULT 0,
  returned_paise bigint NOT NULL DEFAULT 0,
  return_reserved_paise bigint NOT NULL DEFAULT 0,
  method text NOT NULL,
  status text NOT NULL,
  idempotency_key text NOT NULL,
  request_hash text NOT NULL,
  failure_code text,
  closed_at timestamptz(6),
  financial_version integer NOT NULL DEFAULT 1,
  version integer NOT NULL DEFAULT 1,
  collection_key text,
  verified_handover_id uuid,
  collected_by uuid REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  collected_at timestamptz(6),
  created_at timestamptz(6) NOT NULL,
  updated_at timestamptz(6) NOT NULL,
  CONSTRAINT payment_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT payment_attempts_purpose_check CHECK (purpose IN ('order','plan','promotion')),
  CONSTRAINT payment_attempts_method_check CHECK (method IN ('upi','card','net_banking','wallet','cash')),
  CONSTRAINT payment_attempts_status_check CHECK (status IN ('pending','paid','failed','collected','refunded')),
  CONSTRAINT payment_attempts_amount_range CHECK (amount_paise BETWEEN 0 AND 9007199254740991),
  CONSTRAINT payment_attempts_payable_range CHECK (current_payable_paise BETWEEN 0 AND 9007199254740991),
  CONSTRAINT payment_attempts_funded_range CHECK (funded_paise BETWEEN 0 AND 9007199254740991),
  CONSTRAINT payment_attempts_returned_range CHECK (returned_paise >= 0 AND return_reserved_paise >= 0),
  CONSTRAINT payment_attempts_return_budget CHECK (returned_paise + return_reserved_paise <= funded_paise),
  -- Order allocations are bound to their checkout attempt, quote and round.
  CONSTRAINT payment_attempts_order_source CHECK (purpose <> 'order' OR
    (checkout_attempt_id IS NOT NULL AND quote_id IS NOT NULL AND payment_round IS NOT NULL)),
  -- Cash is order-only; collection evidence is paired and implies collected.
  CONSTRAINT payment_attempts_cash_order_only CHECK (method <> 'cash' OR purpose = 'order'),
  CONSTRAINT payment_attempts_collection_pairing CHECK (
    (collection_key IS NULL) = (verified_handover_id IS NULL)
    AND (collection_key IS NULL) = (collected_at IS NULL)
    AND (collection_key IS NULL) = (collected_by IS NULL)),
  CONSTRAINT payment_attempts_collected_cash CHECK (status <> 'collected' OR
    (method = 'cash' AND collection_key IS NOT NULL)),
  CONSTRAINT payment_attempts_version_positive CHECK (version >= 1 AND financial_version >= 1),
  CONSTRAINT payment_attempts_collection_key_unique UNIQUE (collection_key),
  CONSTRAINT payment_attempts_handover_unique UNIQUE (verified_handover_id),
  CONSTRAINT payment_attempts_round_business_key UNIQUE (checkout_attempt_id, payment_round, business_id),
  CONSTRAINT payment_attempts_initiator_key UNIQUE (initiated_by, idempotency_key, business_id)
);
CREATE INDEX payment_attempts_order_history_idx ON payment_attempts (order_id, created_at DESC, id DESC);
CREATE INDEX payment_attempts_business_idx ON payment_attempts (business_id);
CREATE INDEX payment_attempts_quote_idx ON payment_attempts (quote_id);
CREATE INDEX payment_attempts_collected_by_idx ON payment_attempts (collected_by) WHERE collected_by IS NOT NULL;

CREATE TABLE orders (
  id uuid NOT NULL,
  order_number text NOT NULL,
  checkout_attempt_id uuid NOT NULL REFERENCES checkout_attempts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  customer_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  area_id uuid NOT NULL,
  mode text NOT NULL,
  delivery_method text,
  status text NOT NULL,
  payment_attempt_id uuid NOT NULL REFERENCES payment_attempts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ordered_items_subtotal_paise bigint NOT NULL,
  ordered_discount_paise bigint NOT NULL,
  ordered_delivery_fee_paise bigint NOT NULL,
  ordered_platform_fee_paise bigint NOT NULL,
  ordered_total_paise bigint NOT NULL,
  fulfilled_items_subtotal_paise bigint NOT NULL,
  fulfilled_discount_paise bigint NOT NULL,
  fulfilled_delivery_fee_paise bigint NOT NULL,
  fulfilled_platform_fee_paise bigint NOT NULL,
  fulfilled_total_paise bigint NOT NULL,
  financial_version integer NOT NULL DEFAULT 1,
  version integer NOT NULL DEFAULT 1,
  business_snapshot jsonb NOT NULL,
  delivery_address_snapshot jsonb,
  ready_at timestamptz(6),
  fulfilled_at timestamptz(6),
  cancelled_at timestamptz(6),
  placed_at timestamptz(6) NOT NULL,
  created_at timestamptz(6) NOT NULL,
  updated_at timestamptz(6) NOT NULL,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_order_number_key UNIQUE (order_number),
  CONSTRAINT orders_checkout_business_key UNIQUE (checkout_attempt_id, business_id),
  CONSTRAINT orders_payment_attempt_key UNIQUE (payment_attempt_id),
  CONSTRAINT orders_area_city_fkey FOREIGN KEY (area_id, city_id)
    REFERENCES areas(id, city_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT orders_order_number_format CHECK (order_number ~ '^AT[0-9A-Z-]{4,20}$'),
  CONSTRAINT orders_mode_check CHECK (mode IN ('delivery','pickup')),
  CONSTRAINT orders_delivery_method_check CHECK (delivery_method IS NULL OR delivery_method IN ('self','apna_town_rider')),
  CONSTRAINT orders_status_check CHECK (status IN ('placed','accepted','preparing','ready',
    'out_for_delivery','delivered','picked_up','cancelled','refunded')),
  -- Delivery method is null iff pickup; delivery keeps its address snapshot.
  CONSTRAINT orders_mode_method_pairing CHECK ((mode = 'pickup') = (delivery_method IS NULL)),
  CONSTRAINT orders_delivery_address_required CHECK (mode = 'pickup' OR delivery_address_snapshot IS NOT NULL),
  CONSTRAINT orders_mode_statuses CHECK (
    (mode = 'delivery' AND status <> 'picked_up')
    OR (mode = 'pickup' AND status NOT IN ('preparing','out_for_delivery','delivered'))),
  CONSTRAINT orders_ordered_amounts CHECK (
    ordered_items_subtotal_paise BETWEEN 0 AND 9007199254740991
    AND ordered_discount_paise BETWEEN 0 AND ordered_items_subtotal_paise
    AND ordered_delivery_fee_paise BETWEEN 0 AND 9007199254740991
    AND ordered_platform_fee_paise BETWEEN 0 AND 9007199254740991
    AND ordered_total_paise BETWEEN 0 AND 9007199254740991
    AND ordered_total_paise = ordered_items_subtotal_paise - ordered_discount_paise
      + ordered_delivery_fee_paise + ordered_platform_fee_paise),
  CONSTRAINT orders_fulfilled_amounts CHECK (
    fulfilled_items_subtotal_paise BETWEEN 0 AND 9007199254740991
    AND fulfilled_discount_paise BETWEEN 0 AND fulfilled_items_subtotal_paise
    AND fulfilled_delivery_fee_paise BETWEEN 0 AND 9007199254740991
    AND fulfilled_platform_fee_paise BETWEEN 0 AND 9007199254740991
    AND fulfilled_total_paise BETWEEN 0 AND 9007199254740991
    AND fulfilled_total_paise = fulfilled_items_subtotal_paise - fulfilled_discount_paise
      + fulfilled_delivery_fee_paise + fulfilled_platform_fee_paise),
  CONSTRAINT orders_versions_positive CHECK (version >= 1 AND financial_version >= 1),
  CONSTRAINT orders_business_snapshot_object CHECK (jsonb_typeof(business_snapshot) = 'object'),
  CONSTRAINT orders_cancelled_at_pairing CHECK ((status = 'cancelled') <= (cancelled_at IS NOT NULL)),
  CONSTRAINT orders_fulfilled_at_pairing CHECK ((status IN ('delivered','picked_up')) <= (fulfilled_at IS NOT NULL))
);
-- Customer history; business tabs; scoped admin queues; platform admin page.
CREATE INDEX orders_customer_history_idx ON orders (customer_user_id, placed_at DESC, id DESC);
CREATE INDEX orders_business_tab_idx ON orders (business_id, status, placed_at DESC, id DESC);
CREATE INDEX orders_scope_queue_idx ON orders (city_id, area_id, status, placed_at, id);
CREATE INDEX orders_admin_page_idx ON orders (placed_at DESC, id DESC);
CREATE INDEX orders_area_city_idx ON orders (area_id, city_id);

ALTER TABLE payment_attempts ADD CONSTRAINT payment_attempts_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE TABLE order_items (
  id uuid NOT NULL,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  product_id uuid REFERENCES products(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  product_variant_id uuid REFERENCES product_variants(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  product_name_en text NOT NULL,
  product_name_hi text,
  variant_label text,
  ordered_quantity integer NOT NULL,
  fulfilled_quantity integer NOT NULL,
  unit_price_paise bigint NOT NULL,
  ordered_discount_paise bigint NOT NULL,
  ordered_line_total_paise bigint NOT NULL,
  fulfilled_discount_paise bigint NOT NULL,
  fulfilled_line_total_paise bigint NOT NULL,
  availability text NOT NULL DEFAULT 'ordered',
  created_at timestamptz(6) NOT NULL,
  updated_at timestamptz(6) NOT NULL,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_name_length CHECK (char_length(product_name_en) BETWEEN 1 AND 200),
  CONSTRAINT order_items_quantity_range CHECK (ordered_quantity > 0
    AND fulfilled_quantity BETWEEN 0 AND ordered_quantity),
  CONSTRAINT order_items_ordered_amounts CHECK (
    unit_price_paise BETWEEN 0 AND 9007199254740991
    AND ordered_discount_paise BETWEEN 0 AND ordered_quantity * unit_price_paise
    AND ordered_line_total_paise = ordered_quantity * unit_price_paise - ordered_discount_paise),
  CONSTRAINT order_items_fulfilled_amounts CHECK (fulfilled_discount_paise >= 0
    AND fulfilled_line_total_paise >= 0),
  CONSTRAINT order_items_availability_check CHECK (availability IN ('ordered','unavailable'))
);
CREATE INDEX order_items_order_idx ON order_items (order_id, id);
CREATE INDEX order_items_product_order_idx ON order_items (product_id, order_id);
CREATE INDEX order_items_variant_idx ON order_items (product_variant_id) WHERE product_variant_id IS NOT NULL;

CREATE TABLE order_stock_allocations (
  order_item_id uuid NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  reservation_id uuid NOT NULL REFERENCES checkout_attempts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  variant_id uuid REFERENCES product_variants(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  reserved_quantity integer NOT NULL,
  released_quantity integer NOT NULL DEFAULT 0,
  disposition text NOT NULL DEFAULT 'reserved',
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz(6) NOT NULL,
  updated_at timestamptz(6) NOT NULL,
  CONSTRAINT order_stock_allocations_pkey PRIMARY KEY (order_item_id),
  CONSTRAINT order_stock_allocations_quantities CHECK (reserved_quantity > 0
    AND released_quantity BETWEEN 0 AND reserved_quantity),
  CONSTRAINT order_stock_allocations_disposition_check CHECK (disposition IN
    ('reserved','released','fulfilled','held_after_failure')),
  CONSTRAINT order_stock_allocations_version_positive CHECK (version >= 1)
);
CREATE INDEX order_stock_allocations_reservation_idx
  ON order_stock_allocations (reservation_id, product_id, order_item_id);
CREATE INDEX order_stock_allocations_order_idx ON order_stock_allocations (order_id, disposition);
CREATE INDEX order_stock_allocations_product_idx ON order_stock_allocations (product_id);
CREATE INDEX order_stock_allocations_variant_idx ON order_stock_allocations (variant_id) WHERE variant_id IS NOT NULL;

CREATE TABLE order_stock_operations (
  id uuid NOT NULL,
  reservation_id uuid NOT NULL REFERENCES checkout_attempts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  kind text NOT NULL,
  source_key text NOT NULL,
  payload_hash text NOT NULL,
  lines jsonb NOT NULL,
  result jsonb NOT NULL,
  applied_at timestamptz(6) NOT NULL,
  CONSTRAINT order_stock_operations_pkey PRIMARY KEY (id),
  CONSTRAINT order_stock_operations_kind_check CHECK (kind IN ('reserve','release')),
  CONSTRAINT order_stock_operations_source_key UNIQUE (source_key),
  CONSTRAINT order_stock_operations_lines_array CHECK (jsonb_typeof(lines) = 'array'),
  CONSTRAINT order_stock_operations_result_object CHECK (jsonb_typeof(result) = 'object')
);
CREATE INDEX order_stock_operations_replay_idx ON order_stock_operations (reservation_id, applied_at, id);

CREATE TABLE order_status_history (
  id uuid NOT NULL,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  from_status text,
  to_status text NOT NULL,
  event_key text NOT NULL,
  actor_user_id uuid REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  reason_key text,
  created_at timestamptz(6) NOT NULL,
  CONSTRAINT order_status_history_pkey PRIMARY KEY (id),
  CONSTRAINT order_status_history_event_key UNIQUE (order_id, event_key),
  CONSTRAINT order_status_history_to_status_check CHECK (to_status IN ('placed','accepted',
    'preparing','ready','out_for_delivery','delivered','picked_up','cancelled','refunded')),
  CONSTRAINT order_status_history_reason_format CHECK (reason_key IS NULL OR reason_key ~ '^[a-z][a-z0-9_]{1,59}$')
);
CREATE INDEX order_status_history_timeline_idx ON order_status_history (order_id, created_at, id);
CREATE INDEX order_status_history_actor_idx ON order_status_history (actor_user_id, created_at DESC)
  WHERE actor_user_id IS NOT NULL;

CREATE TABLE delivery_codes (
  id uuid NOT NULL,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  kind text NOT NULL,
  generation integer NOT NULL,
  code_hash bytea NOT NULL,
  code_ciphertext bytea,
  hash_key_version text NOT NULL,
  encryption_key_version text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  issued_at timestamptz(6) NOT NULL,
  expires_at timestamptz(6) NOT NULL,
  reissue_available_at timestamptz(6) NOT NULL,
  consumed_at timestamptz(6),
  invalidated_at timestamptz(6),
  locked_at timestamptz(6),
  consumed_handover_id uuid,
  consumed_by uuid REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT delivery_codes_pkey PRIMARY KEY (id),
  CONSTRAINT delivery_codes_kind_check CHECK (kind IN ('delivery_otp','pickup_code')),
  CONSTRAINT delivery_codes_generation_positive CHECK (generation > 0),
  CONSTRAINT delivery_codes_attempts_range CHECK (attempts >= 0 AND max_attempts > 0),
  CONSTRAINT delivery_codes_hash_length CHECK (octet_length(code_hash) = 32),
  CONSTRAINT delivery_codes_expiry_after_issue CHECK (expires_at > issued_at AND reissue_available_at >= issued_at),
  -- A usable generation keeps its ciphertext; a consumed one keeps its receipt.
  CONSTRAINT delivery_codes_usable_ciphertext CHECK (
    consumed_at IS NOT NULL OR invalidated_at IS NOT NULL OR code_ciphertext IS NOT NULL),
  CONSTRAINT delivery_codes_consumed_pairing CHECK (
    (consumed_at IS NULL) = (consumed_handover_id IS NULL)
    AND (consumed_at IS NULL) = (consumed_by IS NULL)),
  CONSTRAINT delivery_codes_generation_key UNIQUE (order_id, kind, generation),
  CONSTRAINT delivery_codes_consumed_handover_key UNIQUE (consumed_handover_id)
);
CREATE UNIQUE INDEX delivery_codes_live_key ON delivery_codes (order_id, kind)
  WHERE consumed_at IS NULL AND invalidated_at IS NULL;
CREATE INDEX delivery_codes_expires_at_idx ON delivery_codes (expires_at);
CREATE INDEX delivery_codes_consumed_by_idx ON delivery_codes (consumed_by) WHERE consumed_by IS NOT NULL;

-- Runtime grants mirror repository use. Purchase snapshots, items, history
-- and stock operations are append-only; identity/amount columns are fixed.
-- SELECT ... FOR UPDATE needs the column UPDATE grants below.
GRANT SELECT, INSERT ON checkout_quotes TO apnatown_runtime;
GRANT SELECT, INSERT ON checkout_attempts TO apnatown_runtime;
GRANT UPDATE (status, failure_code, invalidated_at, version, updated_at)
  ON checkout_attempts TO apnatown_runtime;
GRANT SELECT, INSERT ON payment_attempts TO apnatown_runtime;
GRANT UPDATE (order_id, status, funded_paise, current_payable_paise, closed_at,
  collection_key, verified_handover_id, collected_by, collected_at,
  financial_version, version, updated_at) ON payment_attempts TO apnatown_runtime;
GRANT SELECT, INSERT ON orders TO apnatown_runtime;
GRANT UPDATE (status, version, ready_at, fulfilled_at, cancelled_at, updated_at)
  ON orders TO apnatown_runtime;
GRANT SELECT, INSERT ON order_items, order_status_history, order_stock_operations
  TO apnatown_runtime;
GRANT SELECT, INSERT ON order_stock_allocations TO apnatown_runtime;
GRANT UPDATE (released_quantity, disposition, version, updated_at)
  ON order_stock_allocations TO apnatown_runtime;
GRANT SELECT, INSERT ON delivery_codes TO apnatown_runtime;
GRANT UPDATE (code_ciphertext, attempts, consumed_at, invalidated_at, locked_at,
  consumed_handover_id, consumed_by) ON delivery_codes TO apnatown_runtime;

COMMIT;
