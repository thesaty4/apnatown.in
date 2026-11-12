-- Additive append-only audit trail (BR-12); no audit rows are seeded.
-- Recovery: transaction rollback on failure; inspect actual schema/migration state
-- before retrying. Once populated this is admin/financial evidence: repair forward,
-- never drop or rewrite rows. Retention/de-identification stays disabled (Q-13/Q-32).
BEGIN;

CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "actor_user_id" UUID,
    "actor_role" TEXT NOT NULL,
    "actor_label" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "city_id" UUID,
    "area_id" UUID,
    "related_scopes" JSONB NOT NULL DEFAULT '[]',
    "summary" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "correlation_id" TEXT NOT NULL,
    "ip_hash" BYTEA,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "audit_logs_actor_role_check" CHECK ("actor_role" IN
        ('customer', 'vendor', 'provider', 'rider', 'admin', 'super_admin', 'system')),
    -- NULL actor means system; a system actor never carries a user ID.
    CONSTRAINT "audit_logs_system_actor_check"
        CHECK (("actor_role" = 'system') = ("actor_user_id" IS NULL)),
    CONSTRAINT "audit_logs_actor_label_check"
        CHECK (char_length("actor_label") BETWEEN 1 AND 80 AND "actor_label" !~ '[[:cntrl:]]'),
    CONSTRAINT "audit_logs_action_check"
        CHECK (char_length("action") <= 100 AND "action" ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
    CONSTRAINT "audit_logs_entity_type_check"
        CHECK (char_length("entity_type") <= 64 AND "entity_type" ~ '^[a-z][a-z0-9_]*$'),
    CONSTRAINT "audit_logs_area_city_check" CHECK ("area_id" IS NULL OR "city_id" IS NOT NULL),
    CONSTRAINT "audit_logs_related_scopes_check"
        CHECK (jsonb_typeof("related_scopes") = 'array'),
    CONSTRAINT "audit_logs_summary_check"
        CHECK (char_length("summary") BETWEEN 1 AND 300 AND "summary" !~ '[[:cntrl:]]'),
    CONSTRAINT "audit_logs_before_check"
        CHECK ("before" IS NULL OR jsonb_typeof("before") = 'object'),
    CONSTRAINT "audit_logs_after_check"
        CHECK ("after" IS NULL OR jsonb_typeof("after") = 'object'),
    CONSTRAINT "audit_logs_correlation_id_check"
        CHECK ("correlation_id" ~ '^[A-Za-z0-9_-]{1,64}$'),
    CONSTRAINT "audit_logs_ip_hash_check"
        CHECK ("ip_hash" IS NULL OR octet_length("ip_hash") = 32)
);

CREATE INDEX "audit_logs_feed_idx"
    ON "audit_logs"("occurred_at" DESC, "id" DESC);
CREATE INDEX "audit_logs_entity_history_idx"
    ON "audit_logs"("entity_type", "entity_id", "occurred_at" DESC, "id" DESC);
CREATE INDEX "audit_logs_actor_feed_idx"
    ON "audit_logs"("actor_user_id", "occurred_at" DESC, "id" DESC);
CREATE INDEX "audit_logs_scope_feed_idx"
    ON "audit_logs"("city_id", "area_id", "occurred_at" DESC, "id" DESC);
-- Full-text over actor/action and the already-redacted summary only. Expression
-- indexes are not representable in schema.prisma; this migration is authoritative.
CREATE INDEX "audit_logs_search_idx" ON "audit_logs" USING GIN (
    to_tsvector('simple'::regconfig,
        "actor_label" || ' ' || "action" || ' ' || "summary")
);

-- Account deletion cannot cascade into admin evidence.
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey"
    FOREIGN KEY ("actor_user_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Append-only: the runtime may insert and read, never update or delete.
GRANT SELECT, INSERT ON "audit_logs" TO apnatown_runtime;

COMMIT;
