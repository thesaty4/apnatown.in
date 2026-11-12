-- Additive append-only consent evidence storage; no consent choices are seeded.
-- Recovery: transaction rollback on failure; inspect actual schema/migration state
-- before retrying. Once populated, repair forward or restore an approved backup.
-- Dropping this table destroys legal consent evidence (BR-11).
BEGIN;

CREATE TABLE "consents" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "anonymous_subject_hash" BYTEA,
    "purpose" TEXT NOT NULL,
    "channel" TEXT,
    "granted" BOOLEAN NOT NULL,
    "notice_version" TEXT,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL,
    "source" TEXT NOT NULL,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "consents_subject_check"
        CHECK (("user_id" IS NULL) <> ("anonymous_subject_hash" IS NULL)),
    -- Keyed hash only; the anonymous identity itself is Q-31-gated and never stored raw.
    CONSTRAINT "consents_anonymous_subject_hash_check"
        CHECK ("anonymous_subject_hash" IS NULL OR octet_length("anonymous_subject_hash") = 32),
    CONSTRAINT "consents_purpose_check" CHECK ("purpose" ~ '^[a-z][a-z0-9_]{0,63}$'),
    CONSTRAINT "consents_channel_check"
        CHECK ("channel" IS NULL OR "channel" IN ('in_app', 'email', 'whatsapp')),
    -- Authenticated rows must use the approved purpose/channel registry.
    CONSTRAINT "consents_user_registry_check" CHECK ("user_id" IS NULL OR
        ("purpose" = 'marketing' AND "channel" IN ('in_app', 'email', 'whatsapp')) OR
        ("purpose" IN ('order_updates', 'enquiry_updates') AND "channel" = 'whatsapp')),
    -- A grant is evidence only when the acknowledged notice version is recorded.
    CONSTRAINT "consents_grant_notice_check"
        CHECK (NOT "granted" OR "notice_version" IS NOT NULL),
    CONSTRAINT "consents_notice_version_check"
        CHECK ("notice_version" IS NULL OR "notice_version" ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$'),
    CONSTRAINT "consents_source_check"
        CHECK ("source" IN ('account', 'notification_preferences',
            'marketing_unsubscribe', 'whatsapp_stop'))
);

-- Latest-choice lookups; the leading user_id column also covers the foreign key.
CREATE INDEX "consents_user_choice_idx"
    ON "consents"("user_id", "purpose", "channel", "recorded_at" DESC, "id" DESC);
CREATE INDEX "consents_anonymous_choice_idx"
    ON "consents"("anonymous_subject_hash", "purpose", "channel", "recorded_at" DESC, "id" DESC);

ALTER TABLE "consents" ADD CONSTRAINT "consents_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Append-only evidence: the runtime can neither rewrite nor delete a choice.
GRANT SELECT, INSERT ON "consents" TO apnatown_runtime;

COMMIT;
