-- Additive shared runtime tables. No automatic down migration is provided.
-- Recovery: preserve any written records, inspect constraints/indexes and repair
-- forward with a new reviewed migration; do not drop tables in a live database.

CREATE TABLE outbox_events (
  id uuid PRIMARY KEY,
  type text NOT NULL,
  schema_version integer NOT NULL DEFAULT 1,
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  aggregate_version integer NOT NULL,
  payload jsonb NOT NULL,
  correlation_id text NOT NULL,
  occurred_at timestamptz NOT NULL,
  available_at timestamptz NOT NULL,
  state text NOT NULL DEFAULT 'pending',
  attempt_count integer NOT NULL DEFAULT 0,
  lease_owner text,
  lease_expires_at timestamptz,
  published_at timestamptz,
  last_error_code text,
  CONSTRAINT outbox_events_schema_version_check CHECK (schema_version > 0),
  CONSTRAINT outbox_events_aggregate_version_check CHECK (aggregate_version > 0),
  CONSTRAINT outbox_events_state_check
    CHECK (state IN ('pending', 'publishing', 'published', 'dead')),
  CONSTRAINT outbox_events_attempt_count_check CHECK (attempt_count >= 0),
  CONSTRAINT outbox_events_publishing_lease_check
    CHECK (state <> 'publishing' OR (lease_owner IS NOT NULL AND lease_expires_at IS NOT NULL)),
  CONSTRAINT outbox_events_published_at_check
    CHECK (state <> 'published' OR published_at IS NOT NULL)
);

CREATE INDEX outbox_events_state_available_at_id_idx
  ON outbox_events (state, available_at, id);
CREATE INDEX outbox_events_lease_expires_at_id_idx
  ON outbox_events (lease_expires_at, id)
  WHERE state = 'publishing';
CREATE INDEX outbox_events_aggregate_idx
  ON outbox_events (aggregate_type, aggregate_id, aggregate_version);

CREATE TABLE idempotency_keys (
  id uuid PRIMARY KEY,
  principal_key text NOT NULL,
  operation text NOT NULL,
  key_hash bytea NOT NULL,
  request_hash bytea NOT NULL,
  state text NOT NULL,
  lease_owner text,
  lease_expires_at timestamptz,
  http_status integer,
  response_body jsonb,
  response_headers jsonb NOT NULL DEFAULT '{}',
  resource_ref jsonb,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  CONSTRAINT idempotency_keys_state_check CHECK (state IN ('in_progress', 'completed')),
  CONSTRAINT idempotency_keys_in_progress_lease_check
    CHECK (state <> 'in_progress' OR (lease_owner IS NOT NULL AND lease_expires_at IS NOT NULL)),
  CONSTRAINT idempotency_keys_completed_lease_check
    CHECK (state <> 'completed' OR (lease_owner IS NULL AND lease_expires_at IS NULL)),
  CONSTRAINT idempotency_keys_completed_result_check
    CHECK (state <> 'completed' OR principal_key LIKE 'consumer:%' OR http_status IS NOT NULL),
  -- HTTP rows with no replay body must explicitly use 204; consumers may leave
  -- all HTTP result fields null.
  CONSTRAINT idempotency_keys_http_result_check
    CHECK (http_status IS NULL OR (http_status BETWEEN 100 AND 599
      AND (response_body IS NOT NULL OR http_status = 204)))
);

CREATE UNIQUE INDEX idempotency_keys_principal_operation_key_hash_key
  ON idempotency_keys (principal_key, operation, key_hash);
CREATE INDEX idempotency_keys_expires_at_id_idx
  ON idempotency_keys (expires_at, id);
CREATE INDEX idempotency_keys_state_lease_expires_at_idx
  ON idempotency_keys (state, lease_expires_at);

CREATE TABLE rate_limit_buckets (
  policy_key text NOT NULL,
  subject_hash bytea NOT NULL,
  bucket_start timestamptz NOT NULL,
  hit_count bigint NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  CONSTRAINT rate_limit_buckets_pkey PRIMARY KEY (policy_key, subject_hash, bucket_start),
  CONSTRAINT rate_limit_buckets_hit_count_check CHECK (hit_count >= 0),
  CONSTRAINT rate_limit_buckets_expiry_check CHECK (expires_at > bucket_start)
);

CREATE INDEX rate_limit_buckets_expires_at_idx ON rate_limit_buckets (expires_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON outbox_events, idempotency_keys, rate_limit_buckets
  TO apnatown_runtime;
