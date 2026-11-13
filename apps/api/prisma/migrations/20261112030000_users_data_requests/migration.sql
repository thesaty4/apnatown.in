-- Additive Users data-request storage (export/delete); no requests are seeded.
-- Recovery: transaction rollback on failure; inspect actual schema/migration state
-- before retrying. Once populated, repair forward or restore an approved backup:
-- dropping this table loses erasure receipts and could repeat destructive steps.
BEGIN;

CREATE TABLE "data_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "request_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "idempotency_key" TEXT NOT NULL,
    "policy_version" TEXT,
    "completed_steps" JSONB NOT NULL DEFAULT '{}',
    "artifact_storage_key" TEXT,
    "artifact_expires_at" TIMESTAMPTZ(6),
    "completion_token_hash" BYTEA,
    "completion_token_expires_at" TIMESTAMPTZ(6),
    "failure_code" TEXT,
    "requested_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "data_requests_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "data_requests_request_type_check"
        CHECK ("request_type" IN ('export', 'delete')),
    CONSTRAINT "data_requests_status_check"
        CHECK ("status" IN ('queued', 'processing', 'blocked', 'completed', 'failed')),
    CONSTRAINT "data_requests_idempotency_key_check"
        CHECK ("idempotency_key" ~ '^[A-Za-z0-9._:-]{1,128}$'),
    CONSTRAINT "data_requests_policy_version_check"
        CHECK ("policy_version" IS NULL OR
            ("request_type" = 'delete' AND
             "policy_version" ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$')),
    -- Owner-module receipts keyed by owner step; never personal data.
    CONSTRAINT "data_requests_completed_steps_check"
        CHECK (jsonb_typeof("completed_steps") = 'object'),
    -- Server-generated private object key; never a client input or public URL.
    CONSTRAINT "data_requests_artifact_check"
        CHECK ("artifact_storage_key" IS NULL OR
            ("request_type" = 'export' AND
             "artifact_storage_key" ~ '^[a-z0-9-]+(/[a-z0-9-]+)*\.json$')),
    CONSTRAINT "data_requests_artifact_expiry_check"
        CHECK (("artifact_storage_key" IS NULL) = ("artifact_expires_at" IS NULL)),
    -- Delete-status capability: SHA-256 hash and expiry only, never the token.
    CONSTRAINT "data_requests_completion_token_check"
        CHECK (("completion_token_hash" IS NULL) = ("completion_token_expires_at" IS NULL) AND
            ("completion_token_hash" IS NULL OR
             ("request_type" = 'delete' AND octet_length("completion_token_hash") = 32))),
    CONSTRAINT "data_requests_failure_code_check"
        CHECK ("failure_code" IS NULL OR "failure_code" ~ '^[A-Z][A-Z0-9_]{0,63}$'),
    CONSTRAINT "data_requests_failure_status_check"
        CHECK (("failure_code" IS NOT NULL) = ("status" IN ('blocked', 'failed'))),
    CONSTRAINT "data_requests_completed_at_check"
        CHECK (("completed_at" IS NOT NULL) = ("status" = 'completed'))
);

-- Per-user request idempotency; the leading user_id also covers the foreign key.
CREATE UNIQUE INDEX "data_requests_user_id_idempotency_key_key"
    ON "data_requests"("user_id", "idempotency_key");
-- Owner history and active-request lookups.
CREATE INDEX "data_requests_user_requested_idx"
    ON "data_requests"("user_id", "requested_at" DESC, "id" DESC);
-- Queued/retry work selection.
CREATE INDEX "data_requests_work_idx"
    ON "data_requests"("status", "requested_at", "id")
    WHERE ("status" IN ('queued', 'processing'));

ALTER TABLE "data_requests" ADD CONSTRAINT "data_requests_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- No hard delete; owner, type, idempotency key and request time are immutable.
GRANT SELECT, INSERT ON "data_requests" TO apnatown_runtime;
GRANT UPDATE ("status", "policy_version", "completed_steps", "artifact_storage_key",
    "artifact_expires_at", "completion_token_hash", "completion_token_expires_at",
    "failure_code", "updated_at", "completed_at")
    ON "data_requests" TO apnatown_runtime;

COMMIT;
