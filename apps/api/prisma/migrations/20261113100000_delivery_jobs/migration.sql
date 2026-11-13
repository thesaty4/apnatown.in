-- Platform rider jobs and offers (specs/delivery/be/delivery.md "Tables":
-- delivery_jobs, delivery_offers; rules 1–5, 12; ST-delivery-job).
-- * One job per platform order (UNIQUE order_id); scope = the order's
--   immutable pickup-business city/area.
-- * One active job per rider: partial UNIQUE on rider_user_id over the
--   active statuses is the final concurrency backstop for acceptance.
-- * One live offer per job (partial UNIQUE WHERE status='offered'); a rider
--   is offered a given job at most once (UNIQUE job_id, rider_user_id).
-- * Estimate snapshot at creation; the earned snapshot (base, per-km,
--   distance, displayed distance pay, signed rounding, total, settings
--   version, time) is written once at verified completion, all-or-none,
--   only on delivered.
-- * pickup/drop points are the dispatch geometry (latest only, no trail).
-- No backfill: no rows exist before this change. Recovery is forward repair
-- only; dropping these tables destroys assignment and earnings history.
BEGIN;

CREATE TABLE delivery_jobs (
  id uuid NOT NULL,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  area_id uuid NOT NULL,
  rider_user_id uuid REFERENCES rider_profiles(user_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  status text NOT NULL DEFAULT 'requested',
  assignment_state text NOT NULL DEFAULT 'queued',
  fail_reason text,
  cancellation_reason text,
  pickup_point geography(Point,4326),
  drop_point geography(Point,4326),
  distance_m integer NOT NULL,
  estimate_base_paise bigint NOT NULL,
  estimate_per_km_paise bigint NOT NULL,
  estimate_total_paise bigint NOT NULL,
  estimate_settings_version text NOT NULL,
  estimated_at timestamptz(6) NOT NULL,
  earned_base_paise bigint,
  earned_per_km_paise bigint,
  earned_distance_m integer,
  earned_distance_pay_paise bigint,
  earned_rounding_paise bigint,
  earned_total_paise bigint,
  earned_settings_version text,
  earned_at timestamptz(6),
  payable_financial_version integer NOT NULL,
  checked_item_ids uuid[] NOT NULL DEFAULT '{}',
  checked_financial_version integer,
  version integer NOT NULL DEFAULT 1,
  accepted_at timestamptz(6),
  reached_shop_at timestamptz(6),
  picked_up_at timestamptz(6),
  reached_drop_at timestamptz(6),
  delivered_at timestamptz(6),
  failed_at timestamptz(6),
  cancelled_at timestamptz(6),
  created_at timestamptz(6) NOT NULL,
  updated_at timestamptz(6) NOT NULL,
  CONSTRAINT delivery_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT delivery_jobs_order_key UNIQUE (order_id),
  CONSTRAINT delivery_jobs_area_city_fkey FOREIGN KEY (area_id, city_id)
    REFERENCES areas(id, city_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT delivery_jobs_status_check CHECK (status IN
    ('requested','accepted','reached_shop','picked_up','reached_drop','delivered','failed','cancelled')),
  CONSTRAINT delivery_jobs_assignment_state_check CHECK (assignment_state IN
    ('queued','offered','unassigned','assigned')),
  CONSTRAINT delivery_jobs_fail_reason_check CHECK (fail_reason IS NULL OR fail_reason IN
    ('customer_unreachable','wrong_address','customer_cancelled','vehicle_problem')),
  CONSTRAINT delivery_jobs_cancellation_reason_length CHECK (
    cancellation_reason IS NULL OR char_length(cancellation_reason) BETWEEN 1 AND 64),
  CONSTRAINT delivery_jobs_money_nonnegative CHECK (
    distance_m >= 0 AND estimate_base_paise >= 0 AND estimate_per_km_paise >= 0
    AND estimate_total_paise BETWEEN 0 AND 9007199254740991
    AND (earned_base_paise IS NULL OR earned_base_paise >= 0)
    AND (earned_per_km_paise IS NULL OR earned_per_km_paise >= 0)
    AND (earned_distance_m IS NULL OR earned_distance_m >= 0)
    AND (earned_distance_pay_paise IS NULL OR earned_distance_pay_paise >= 0)
    AND (earned_total_paise IS NULL OR earned_total_paise BETWEEN 0 AND 9007199254740991)),
  CONSTRAINT delivery_jobs_version_positive CHECK (version >= 1 AND payable_financial_version >= 1),
  -- An assigned job has its rider; before acceptance there is none.
  CONSTRAINT delivery_jobs_assignment_rider CHECK (
    (assignment_state = 'assigned') = (rider_user_id IS NOT NULL)),
  CONSTRAINT delivery_jobs_progress_assigned CHECK (
    status IN ('requested','cancelled','failed') OR assignment_state = 'assigned'),
  CONSTRAINT delivery_jobs_failed_reason CHECK ((status = 'failed') = (fail_reason IS NOT NULL)),
  CONSTRAINT delivery_jobs_cancelled_reason CHECK (
    (status = 'cancelled') = (cancellation_reason IS NOT NULL)),
  -- Earned snapshot is all-or-none and exists only on delivered jobs.
  CONSTRAINT delivery_jobs_earned_snapshot CHECK (
    (status = 'delivered') = (earned_total_paise IS NOT NULL)
    AND (earned_total_paise IS NULL) = (earned_base_paise IS NULL)
    AND (earned_total_paise IS NULL) = (earned_per_km_paise IS NULL)
    AND (earned_total_paise IS NULL) = (earned_distance_m IS NULL)
    AND (earned_total_paise IS NULL) = (earned_distance_pay_paise IS NULL)
    AND (earned_total_paise IS NULL) = (earned_rounding_paise IS NULL)
    AND (earned_total_paise IS NULL) = (earned_settings_version IS NULL)
    AND (earned_total_paise IS NULL) = (earned_at IS NULL)),
  CONSTRAINT delivery_jobs_checked_pairing CHECK (
    cardinality(checked_item_ids) = 0 OR checked_financial_version IS NOT NULL)
);
-- One active job per rider (rule 3 backstop).
CREATE UNIQUE INDEX delivery_jobs_rider_active_key ON delivery_jobs (rider_user_id)
  WHERE status IN ('accepted','reached_shop','picked_up','reached_drop');
-- Rider history / earnings (own rows, newest first).
CREATE INDEX delivery_jobs_rider_history_idx
  ON delivery_jobs (rider_user_id, created_at DESC, id DESC);
-- Earned-period totals (rolling day/week).
CREATE INDEX delivery_jobs_rider_earned_idx
  ON delivery_jobs (rider_user_id, earned_at) WHERE earned_at IS NOT NULL;
-- Scoped live/unassigned queues.
CREATE INDEX delivery_jobs_scope_status_idx ON delivery_jobs (city_id, area_id, status);
CREATE INDEX delivery_jobs_area_city_idx ON delivery_jobs (area_id, city_id);

CREATE TABLE delivery_offers (
  id uuid NOT NULL,
  job_id uuid NOT NULL REFERENCES delivery_jobs(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  rider_user_id uuid NOT NULL REFERENCES rider_profiles(user_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  status text NOT NULL DEFAULT 'offered',
  expires_at timestamptz(6) NOT NULL,
  responded_at timestamptz(6),
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz(6) NOT NULL,
  updated_at timestamptz(6) NOT NULL,
  CONSTRAINT delivery_offers_pkey PRIMARY KEY (id),
  CONSTRAINT delivery_offers_job_rider_key UNIQUE (job_id, rider_user_id),
  CONSTRAINT delivery_offers_status_check CHECK (status IN
    ('offered','accepted','rejected','expired','revoked')),
  CONSTRAINT delivery_offers_expiry_after_creation CHECK (expires_at > created_at),
  CONSTRAINT delivery_offers_responded_pairing CHECK ((status = 'offered') = (responded_at IS NULL)),
  CONSTRAINT delivery_offers_version_positive CHECK (version >= 1)
);
-- One live offer per job (rule 2).
CREATE UNIQUE INDEX delivery_offers_live_job_key ON delivery_offers (job_id)
  WHERE status = 'offered';
-- Rider's current request and the expiry sweep.
CREATE INDEX delivery_offers_rider_status_idx
  ON delivery_offers (rider_user_id, status, expires_at);
CREATE INDEX delivery_offers_live_expiry_idx ON delivery_offers (expires_at)
  WHERE status = 'offered';

-- Runtime grants mirror repository use; identity/scope/estimate are fixed.
-- SELECT ... FOR UPDATE needs the column UPDATE grants below.
GRANT SELECT, INSERT ON delivery_jobs TO apnatown_runtime;
GRANT UPDATE (rider_user_id, status, assignment_state, fail_reason,
  cancellation_reason, earned_base_paise, earned_per_km_paise,
  earned_distance_m, earned_distance_pay_paise, earned_rounding_paise,
  earned_total_paise, earned_settings_version, earned_at, checked_item_ids,
  checked_financial_version, version, accepted_at, reached_shop_at,
  picked_up_at, reached_drop_at, delivered_at, failed_at, cancelled_at,
  updated_at)
  ON delivery_jobs TO apnatown_runtime;
GRANT SELECT, INSERT ON delivery_offers TO apnatown_runtime;
GRANT UPDATE (status, responded_at, version, updated_at)
  ON delivery_offers TO apnatown_runtime;

COMMIT;
