-- Additive Businesses storage (F-PF/F-VD/F-PV, BR-01/02/06/08/12/14/16):
-- businesses, product-category memberships, weekly IST hours, fulfilment
-- settings, private onboarding document references, billing identity, and the
-- reporting-v1 visible-profile counters (transient dedup + IST daily totals).
-- No businesses are seeded. There is no legacy `businesses.category_id`
-- column in this repository, so the category backfill is a no-op: memberships
-- are written only to `business_categories`.
-- `logo_asset_id`, `cover_asset_id` and `business_documents.asset_id`
-- (-> media_assets) stay plain uuid columns; the Media migration adds those FKs.
-- Adds the deferred `subcategory_suggestions.business_id` FK. No suggestion
-- rows can exist yet (the previous Catalog business-context adapter denied
-- every suggestion), so the FK validates trivially.
-- Recovery: transaction rollback on failure; inspect actual schema/migration
-- state before retrying. Once populated, repair forward; dropping these tables
-- destroys business identity, approvals history, private document references,
-- fiscal profiles and measured profile views.
BEGIN;

CREATE TABLE "businesses" (
    "id" UUID NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "name_en" TEXT,
    "name_hi" TEXT,
    "slug" TEXT,
    "description" TEXT,
    "city_id" UUID,
    "area_id" UUID,
    "address_text" TEXT,
    "location" geography(Point,4326),
    "phone_e164" TEXT NOT NULL,
    "whatsapp_e164" TEXT,
    "email" TEXT,
    "instagram_url" TEXT,
    "youtube_url" TEXT,
    "facebook_url" TEXT,
    "logo_asset_id" UUID,
    "cover_asset_id" UUID,
    "verified_at" TIMESTAMPTZ(6),
    "submitted_at" TIMESTAMPTZ(6),
    "review_reason" TEXT,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "version" INTEGER NOT NULL DEFAULT 1,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "businesses_kind_check" CHECK ("kind" IN ('shop', 'provider')),
    CONSTRAINT "businesses_status_check" CHECK ("status" IN ('draft', 'pending',
        'approved', 'rejected', 'changes_requested', 'suspended', 'inactive')),
    CONSTRAINT "businesses_version_check" CHECK ("version" > 0),
    CONSTRAINT "businesses_slug_check" CHECK ("slug" IS NULL OR
        ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length("slug") <= 100)),
    CONSTRAINT "businesses_names_check" CHECK (
        ("name_en" IS NULL OR (char_length(btrim("name_en")) BETWEEN 2 AND 80
            AND "name_en" !~ '[[:cntrl:]<>]'))
        AND ("name_hi" IS NULL OR (char_length(btrim("name_hi")) BETWEEN 1 AND 80
            AND "name_hi" !~ '[[:cntrl:]<>]'))),
    CONSTRAINT "businesses_text_check" CHECK (
        ("description" IS NULL OR char_length("description") <= 1000)
        AND ("address_text" IS NULL OR char_length("address_text") <= 300)
        AND ("review_reason" IS NULL OR char_length("review_reason") <= 500)),
    CONSTRAINT "businesses_phones_check" CHECK ("phone_e164" ~ '^\+[1-9][0-9]{7,14}$'
        AND ("whatsapp_e164" IS NULL OR "whatsapp_e164" ~ '^\+[1-9][0-9]{7,14}$')),
    CONSTRAINT "businesses_social_check" CHECK (
        ("instagram_url" IS NULL OR "instagram_url" ~ '^https://')
        AND ("youtube_url" IS NULL OR "youtube_url" ~ '^https://')
        AND ("facebook_url" IS NULL OR "facebook_url" ~ '^https://')),
    CONSTRAINT "businesses_area_city_pair_check"
        CHECK (("area_id" IS NULL) = ("city_id" IS NULL)),
    -- Submitted statuses keep every submission-required value (rule 2).
    CONSTRAINT "businesses_submitted_check" CHECK ("status" = 'draft' OR
        ("slug" IS NOT NULL AND "name_en" IS NOT NULL AND "area_id" IS NOT NULL
         AND "address_text" IS NOT NULL AND "submitted_at" IS NOT NULL)),
    CONSTRAINT "businesses_location_check" CHECK ("location" IS NULL OR
        (NOT ST_IsEmpty("location"::geometry) AND ST_IsValid("location"::geometry)
         AND ST_Y("location"::geometry) BETWEEN -90 AND 90
         AND ST_X("location"::geometry) BETWEEN -180 AND 180))
);

-- TODO(verify) Q-42: one application per owner and kind.
CREATE UNIQUE INDEX "businesses_owner_kind_key" ON "businesses"("owner_user_id", "kind");
CREATE UNIQUE INDEX "businesses_slug_key" ON "businesses"("slug");
CREATE INDEX "businesses_owner_status_idx" ON "businesses"("owner_user_id", "status");
CREATE INDEX "businesses_queue_idx" ON "businesses"("status", "area_id", "created_at", "id");
CREATE INDEX "businesses_area_city_idx" ON "businesses"("area_id", "city_id");
CREATE INDEX "businesses_location_gist_idx" ON "businesses" USING GIST ("location");

ALTER TABLE "businesses" ADD CONSTRAINT "businesses_owner_user_id_fkey"
    FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_reviewed_by_fkey"
    FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
-- The composite key prevents a valid area ID being paired with another city.
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_area_city_fkey"
    FOREIGN KEY ("area_id", "city_id") REFERENCES "areas"("id", "city_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE TABLE "business_categories" (
    "business_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "business_categories_pkey" PRIMARY KEY ("business_id", "category_id")
);
CREATE UNIQUE INDEX "business_categories_primary_key"
    ON "business_categories"("business_id") WHERE "is_primary";
CREATE INDEX "business_categories_category_idx"
    ON "business_categories"("category_id", "business_id");
ALTER TABLE "business_categories" ADD CONSTRAINT "business_categories_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE RESTRICT;
ALTER TABLE "business_categories" ADD CONSTRAINT "business_categories_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Recurring IST wall-clock times, not instants.
CREATE TABLE "business_hours" (
    "business_id" UUID NOT NULL,
    "day_of_week" SMALLINT NOT NULL,
    "opens_at" TIME(0),
    "closes_at" TIME(0),
    "is_closed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "business_hours_pkey" PRIMARY KEY ("business_id", "day_of_week"),
    CONSTRAINT "business_hours_day_check" CHECK ("day_of_week" BETWEEN 0 AND 6),
    CONSTRAINT "business_hours_times_check" CHECK (
        ("is_closed" AND "opens_at" IS NULL AND "closes_at" IS NULL)
        OR (NOT "is_closed" AND "opens_at" IS NOT NULL AND "closes_at" IS NOT NULL
            AND "opens_at" <> "closes_at"))
);
ALTER TABLE "business_hours" ADD CONSTRAINT "business_hours_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

CREATE TABLE "business_settings" (
    "business_id" UUID NOT NULL,
    "temporarily_closed" BOOLEAN NOT NULL DEFAULT false,
    "delivery_method" TEXT,
    "delivery_radius_km" NUMERIC(5,2),
    "delivery_fee_paise" BIGINT,
    "minimum_order_paise" BIGINT,
    "pickup_enabled" BOOLEAN NOT NULL DEFAULT false,
    "pickup_instructions" TEXT,
    "service_radius_km" NUMERIC(5,2),
    "service_area" TEXT,
    "gallery_media_default" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "business_settings_pkey" PRIMARY KEY ("business_id"),
    CONSTRAINT "business_settings_delivery_method_check"
        CHECK ("delivery_method" IS NULL OR "delivery_method" IN ('self', 'apna_town_rider')),
    CONSTRAINT "business_settings_amounts_check" CHECK (
        ("delivery_radius_km" IS NULL OR "delivery_radius_km" >= 0)
        AND ("delivery_fee_paise" IS NULL OR "delivery_fee_paise" >= 0)
        AND ("minimum_order_paise" IS NULL OR "minimum_order_paise" >= 0)
        AND ("service_radius_km" IS NULL OR "service_radius_km" >= 0)),
    -- Enabled delivery needs radius and minimum; self-delivery an explicit fee.
    CONSTRAINT "business_settings_delivery_check" CHECK ("delivery_method" IS NULL OR
        ("delivery_radius_km" IS NOT NULL AND "minimum_order_paise" IS NOT NULL
         AND ("delivery_method" <> 'self' OR "delivery_fee_paise" IS NOT NULL))),
    CONSTRAINT "business_settings_text_check" CHECK (
        ("pickup_instructions" IS NULL OR char_length("pickup_instructions") <= 300)
        AND ("service_area" IS NULL OR char_length("service_area") <= 200))
);
ALTER TABLE "business_settings" ADD CONSTRAINT "business_settings_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- Private KYC references only; file metadata/storage keys live in Media.
-- TODO(verify) Q-05/Q-40: retention, allowlist and size policy.
CREATE TABLE "business_documents" (
    "id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "document_kind" TEXT NOT NULL,
    "asset_id" UUID NOT NULL,
    "uploaded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "business_documents_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "business_documents_kind_check"
        CHECK ("document_kind" IN ('owner_id', 'business_photo', 'registration_document'))
);
CREATE UNIQUE INDEX "business_documents_asset_id_key" ON "business_documents"("asset_id");
CREATE INDEX "business_documents_business_idx"
    ON "business_documents"("business_id", "created_at" DESC, "id" DESC);
ALTER TABLE "business_documents" ADD CONSTRAINT "business_documents_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "business_documents" ADD CONSTRAINT "business_documents_uploaded_by_fkey"
    FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Draft/approved snapshots use the shared SupplierTaxProfile shape; the
-- approved snapshot carries the reviewer-verified `requiresIrn`.
CREATE TABLE "business_billing_profiles" (
    "business_id" UUID NOT NULL,
    "draft" JSONB NOT NULL,
    "approved_snapshot" JSONB,
    "review_status" TEXT NOT NULL DEFAULT 'pending',
    "version" INTEGER NOT NULL DEFAULT 1,
    "approved_version" INTEGER,
    "review_reason" TEXT,
    "verification_evidence_ref" TEXT,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "business_billing_profiles_pkey" PRIMARY KEY ("business_id"),
    CONSTRAINT "business_billing_profiles_status_check"
        CHECK ("review_status" IN ('pending', 'approved', 'rejected')),
    CONSTRAINT "business_billing_profiles_version_check" CHECK ("version" > 0
        AND ("approved_version" IS NULL OR "approved_version" BETWEEN 1 AND "version")),
    CONSTRAINT "business_billing_profiles_draft_check" CHECK (jsonb_typeof("draft") = 'object'),
    CONSTRAINT "business_billing_profiles_snapshot_check" CHECK (
        ("approved_snapshot" IS NULL) = ("approved_version" IS NULL)),
    CONSTRAINT "business_billing_profiles_review_check" CHECK ("review_status" = 'pending' OR
        ("reviewed_by" IS NOT NULL AND "reviewed_at" IS NOT NULL))
);
ALTER TABLE "business_billing_profiles" ADD CONSTRAINT "business_billing_profiles_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "business_billing_profiles" ADD CONSTRAINT "business_billing_profiles_reviewed_by_fkey"
    FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- reporting-v1 visible-detail measurement. Dedup claims are transient
-- (server-derived session hash, removed after 48 hours by the worker).
CREATE TABLE "business_view_dedup" (
    "session_subject_hash" BYTEA NOT NULL,
    "window_start" TIMESTAMPTZ(6) NOT NULL,
    "business_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

    CONSTRAINT "business_view_dedup_pkey"
        PRIMARY KEY ("session_subject_hash", "window_start", "business_id"),
    CONSTRAINT "business_view_dedup_hash_check" CHECK (octet_length("session_subject_hash") = 32)
);
CREATE INDEX "business_view_dedup_created_at_idx" ON "business_view_dedup"("created_at");
ALTER TABLE "business_view_dedup" ADD CONSTRAINT "business_view_dedup_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

CREATE TABLE "business_daily_views" (
    "business_id" UUID NOT NULL,
    "ist_date" DATE NOT NULL,
    "views" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "business_daily_views_pkey" PRIMARY KEY ("business_id", "ist_date"),
    CONSTRAINT "business_daily_views_views_check" CHECK ("views" >= 0)
);
ALTER TABLE "business_daily_views" ADD CONSTRAINT "business_daily_views_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- Known counter start; earlier days are unavailable, never zero.
CREATE TABLE "business_reporting_coverage" (
    "metric" TEXT NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "business_reporting_coverage_pkey" PRIMARY KEY ("metric"),
    CONSTRAINT "business_reporting_coverage_metric_check" CHECK ("metric" IN ('profile_views'))
);
INSERT INTO "business_reporting_coverage" ("metric", "started_at") VALUES ('profile_views', now());

ALTER TABLE "subcategory_suggestions" ADD CONSTRAINT "subcategory_suggestions_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Runtime grants: businesses are soft-deleted; memberships/hours are replaced
-- on edit; documents are append-only references; dedup claims are cleaned up.
GRANT SELECT, INSERT ON "businesses" TO apnatown_runtime;
-- Ownership, identity, creation time and `verified_at` (Q-41: no awarding
-- rule yet) cannot be rewritten by the runtime.
GRANT UPDATE ("kind", "status", "name_en", "name_hi", "slug", "description",
    "city_id", "area_id", "address_text", "location", "phone_e164", "whatsapp_e164",
    "email", "instagram_url", "youtube_url", "facebook_url", "logo_asset_id",
    "cover_asset_id", "submitted_at", "review_reason", "reviewed_by", "reviewed_at",
    "version", "deleted_at", "updated_at") ON "businesses" TO apnatown_runtime;
GRANT SELECT, INSERT, DELETE ON "business_categories", "business_hours" TO apnatown_runtime;
GRANT SELECT, INSERT, UPDATE ON "business_settings", "business_billing_profiles" TO apnatown_runtime;
GRANT SELECT, INSERT ON "business_documents" TO apnatown_runtime;
GRANT SELECT, INSERT, DELETE ON "business_view_dedup" TO apnatown_runtime;
GRANT SELECT, INSERT, UPDATE ON "business_daily_views" TO apnatown_runtime;
GRANT SELECT ON "business_reporting_coverage" TO apnatown_runtime;

COMMIT;
