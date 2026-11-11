-- Additive Auth storage. No challenges, session credentials or login bypasses
-- are seeded. Recovery is forward-only after preserving required security state;
-- dropping populated tables would discard sessions and challenge bookkeeping.
BEGIN;

CREATE TABLE "otp_challenges" (
    "id" UUID NOT NULL,
    "phone_ciphertext" TEXT NOT NULL,
    "phone_lookup_hash" BYTEA NOT NULL,
    "code_hash" TEXT NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "resend_after" TIMESTAMPTZ(6) NOT NULL,
    "verified_at" TIMESTAMPTZ(6),
    "superseded_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "otp_challenges_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "otp_challenges_attempt_count_check" CHECK ("attempt_count" >= 0),
    CONSTRAINT "otp_challenges_expiry_check" CHECK ("expires_at" > "created_at"),
    CONSTRAINT "otp_challenges_resend_check" CHECK ("resend_after" >= "created_at")
);

CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "user_id" UUID,
    "token_hash" BYTEA NOT NULL,
    "csrf_token" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sessions_kind_user_check" CHECK (
        ("kind" = 'anonymous' AND "user_id" IS NULL)
        OR ("kind" = 'authenticated' AND "user_id" IS NOT NULL)
    ),
    CONSTRAINT "sessions_token_hash_check" CHECK (octet_length("token_hash") = 32),
    CONSTRAINT "sessions_expiry_check" CHECK ("expires_at" > "created_at")
);

CREATE INDEX "otp_challenges_phone_created_at_idx"
    ON "otp_challenges"("phone_lookup_hash", "created_at" DESC);
CREATE INDEX "otp_challenges_expires_at_idx" ON "otp_challenges"("expires_at");
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");
CREATE INDEX "sessions_user_revoked_expires_at_idx"
    ON "sessions"("user_id", "revoked_at", "expires_at");
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE RESTRICT;

GRANT SELECT, INSERT, UPDATE, DELETE ON "otp_challenges", "sessions"
    TO apnatown_runtime;

COMMIT;
