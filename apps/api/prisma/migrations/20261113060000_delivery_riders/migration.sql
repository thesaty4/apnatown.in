-- Delivery rider applications/profiles (specs/delivery/be/delivery.md
-- "Tables": rider_profiles, rider_documents; F-RD-001/002/008, F-AD-002).
-- * rider_profiles: one row per applicant user. Draft/editable rows may miss
--   later-step fields; any submitted status must carry the submission fields
--   (payout presence stays an application rule: the demo seed has none).
--   Payout UPI/bank values are AES-GCM ciphertext written by the API (PII
--   encryption key outside the DB); never plaintext.
-- * Online implies approved; latest location only (no trail), paired with
--   its timestamp.
-- * rider_documents: typed private KYC references. No runtime writer exists
--   until Media ships the private `kyc_document` purpose (Q-05); the table
--   lands now so the contract and FKs are fixed.
-- delivery_jobs/offers/codes FK `orders`, which has not shipped: deferred.
-- No backfill; no rows exist before this change. Recovery: transaction
-- rollback on failure; once populated, repair forward only (dropping these
-- tables destroys rider approval state).
BEGIN;

CREATE TABLE rider_profiles (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  city_id uuid REFERENCES cities(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  area_id uuid,
  full_name text,
  vehicle_type text,
  vehicle_number text,
  payout_upi_ciphertext text,
  payout_bank_ciphertext text,
  status text NOT NULL DEFAULT 'draft',
  decision_reason text,
  requirements_version text,
  submitted_at timestamptz(6),
  is_online boolean NOT NULL DEFAULT false,
  last_location geography(Point,4326),
  last_location_at timestamptz(6),
  preferred_locale text NOT NULL DEFAULT 'en',
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT rider_profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT rider_profiles_area_city_fkey FOREIGN KEY (area_id, city_id)
    REFERENCES areas(id, city_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT rider_profiles_status_check CHECK (status IN
    ('draft','pending','approved','rejected','changes_requested','suspended','inactive')),
  CONSTRAINT rider_profiles_vehicle_type_check CHECK (vehicle_type IS NULL OR vehicle_type IN ('bike','scooter','cycle')),
  CONSTRAINT rider_profiles_full_name_length CHECK (full_name IS NULL OR char_length(full_name) BETWEEN 2 AND 60),
  CONSTRAINT rider_profiles_vehicle_number_length CHECK (vehicle_number IS NULL OR char_length(vehicle_number) BETWEEN 4 AND 20),
  CONSTRAINT rider_profiles_decision_reason_length CHECK (decision_reason IS NULL OR char_length(decision_reason) BETWEEN 1 AND 500),
  CONSTRAINT rider_profiles_locale_check CHECK (preferred_locale IN ('en','hi')),
  CONSTRAINT rider_profiles_version_positive CHECK (version >= 1),
  -- A composite FK with a NULL city is not enforced: an area needs its city.
  CONSTRAINT rider_profiles_area_needs_city CHECK (area_id IS NULL OR city_id IS NOT NULL),
  CONSTRAINT rider_profiles_online_requires_approved CHECK (NOT is_online OR status = 'approved'),
  CONSTRAINT rider_profiles_location_pairing CHECK ((last_location IS NULL) = (last_location_at IS NULL)),
  CONSTRAINT rider_profiles_submitted_fields CHECK (status = 'draft' OR (
    full_name IS NOT NULL AND city_id IS NOT NULL AND area_id IS NOT NULL
    AND vehicle_type IS NOT NULL AND submitted_at IS NOT NULL))
);
-- Nearby approved online riders (dispatch/live; Orders-gated consumers).
CREATE INDEX rider_profiles_online_location_gist_idx ON rider_profiles
  USING GIST (last_location) WHERE is_online AND status = 'approved';
-- Scoped approvals queue: area/city visibility + status, keyset (created_at, user_id).
CREATE INDEX rider_profiles_scope_queue_idx
  ON rider_profiles (city_id, area_id, status, created_at, user_id);
-- Platform-wide (super_admin) queue keyset.
CREATE INDEX rider_profiles_status_queue_idx
  ON rider_profiles (status, created_at, user_id);
CREATE INDEX rider_profiles_area_city_idx ON rider_profiles (area_id, city_id);

CREATE TABLE rider_documents (
  id uuid NOT NULL,
  rider_user_id uuid NOT NULL REFERENCES rider_profiles(user_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  doc_type text NOT NULL,
  media_asset_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  superseded_at timestamptz(6),
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT rider_documents_pkey PRIMARY KEY (id),
  CONSTRAINT rider_documents_doc_type_check CHECK (doc_type IN ('selfie','licence','id_proof','rc','other')),
  CONSTRAINT rider_documents_rider_type_asset_key UNIQUE (rider_user_id, doc_type, media_asset_id)
);
-- One live document per typed kind ('other' may repeat).
CREATE UNIQUE INDEX rider_documents_live_kind_key ON rider_documents (rider_user_id, doc_type)
  WHERE superseded_at IS NULL AND doc_type <> 'other';
CREATE INDEX rider_documents_media_asset_idx ON rider_documents (media_asset_id);

-- Runtime grants mirror repository use; identity/creation columns are fixed.
-- SELECT ... FOR UPDATE needs the column UPDATE grants below.
GRANT SELECT, INSERT ON rider_profiles TO apnatown_runtime;
GRANT UPDATE (city_id, area_id, full_name, vehicle_type, vehicle_number,
  payout_upi_ciphertext, payout_bank_ciphertext, status, decision_reason,
  requirements_version, submitted_at, is_online, last_location,
  last_location_at, preferred_locale, version, updated_at)
  ON rider_profiles TO apnatown_runtime;
-- Documents are append-only references; replacement sets superseded_at.
GRANT SELECT, INSERT ON rider_documents TO apnatown_runtime;
GRANT UPDATE (superseded_at) ON rider_documents TO apnatown_runtime;

COMMIT;
