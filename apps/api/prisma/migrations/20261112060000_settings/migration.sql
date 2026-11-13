-- Additive Settings storage (F-SA-005/F-AC-005/F-AC-006/F-X-009): versioned
-- platform configuration, feature flags, legal pages and support intake.
-- Seeds only what the settings/media specs define: every feature flag starts
-- disabled (TODO(verify) launch values) and `uploads` holds the Media public
-- image hard ceilings. No commercial values, contacts or legal copy are seeded.
-- Recovery: transaction rollback on failure; inspect actual schema/migration state
-- before retrying. Once populated, repair forward; dropping these tables removes
-- platform configuration, legal publication history and support evidence.
BEGIN;

CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key"),
    CONSTRAINT "settings_key_check" CHECK ("key" IN
        ('branding', 'delivery', 'rider_earning', 'commission', 'plans', 'promotion_fees',
         'payments', 'policies', 'reviews', 'uploads', 'integrations', 'seo', 'tax')),
    -- Per-key shapes are zod-validated by the application before every save.
    CONSTRAINT "settings_value_check" CHECK (jsonb_typeof("value") IN ('object', 'array')),
    CONSTRAINT "settings_version_check" CHECK ("version" > 0)
);

CREATE TABLE "feature_flags" (
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("key"),
    CONSTRAINT "feature_flags_key_check" CHECK ("key" IN
        ('reviews', 'guest_browse', 'whatsapp', 'booking', 'donations',
         'payments_online', 'payments_cod', 'maintenance')),
    -- Future products stay non-enablable until separately approved.
    CONSTRAINT "feature_flags_future_check"
        CHECK ("key" NOT IN ('booking', 'donations') OR "enabled" = false),
    CONSTRAINT "feature_flags_version_check" CHECK ("version" > 0)
);

CREATE TABLE "legal_pages" (
    "slug" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "title_hi" TEXT NOT NULL,
    "body_en" TEXT NOT NULL,
    "body_hi" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "published_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "legal_pages_pkey" PRIMARY KEY ("slug"),
    CONSTRAINT "legal_pages_slug_check" CHECK ("slug" IN ('terms', 'privacy', 'refund', 'about')),
    CONSTRAINT "legal_pages_title_check" CHECK (
        char_length("title_en") BETWEEN 1 AND 120 AND "title_en" !~ '[[:cntrl:]<>]' AND
        char_length("title_hi") BETWEEN 1 AND 120 AND "title_hi" !~ '[[:cntrl:]<>]'),
    -- Bodies are a sanitised Markdown subset; raw angle brackets never persist.
    CONSTRAINT "legal_pages_body_check" CHECK (
        char_length("body_en") BETWEEN 1 AND 12000 AND "body_en" !~ '[<>]' AND
        char_length("body_hi") BETWEEN 1 AND 12000 AND "body_hi" !~ '[<>]'),
    CONSTRAINT "legal_pages_version_check" CHECK ("version" > 0)
);

CREATE TABLE "support_messages" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "message" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "source_key" TEXT,
    "city_id" UUID,
    "area_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "support_messages_message_check" CHECK (
        "message" = btrim("message", E' \t\n\r')
        AND char_length("message") BETWEEN 1 AND 1000),
    CONSTRAINT "support_messages_source_check" CHECK ("source" IN ('web', 'rider')),
    -- Delegated intake (rider) deduplicates on its owner-supplied key.
    CONSTRAINT "support_messages_source_key_check" CHECK (
        ("source" = 'web' AND "source_key" IS NULL) OR
        ("source" = 'rider' AND "source_key" ~ '^[A-Za-z0-9._:-]{1,128}$'
            AND "user_id" IS NOT NULL)),
    -- Trusted resolved scope: an area always names its city; unscoped is both null.
    CONSTRAINT "support_messages_scope_check" CHECK ("area_id" IS NULL OR "city_id" IS NOT NULL)
);

CREATE INDEX "settings_updated_by_idx" ON "settings"("updated_by");
CREATE INDEX "feature_flags_updated_by_idx" ON "feature_flags"("updated_by");
CREATE INDEX "legal_pages_updated_by_idx" ON "legal_pages"("updated_by");
CREATE UNIQUE INDEX "support_messages_source_key_key"
    ON "support_messages"("source", "source_key");
CREATE INDEX "support_messages_scope_feed_idx"
    ON "support_messages"("city_id", "area_id", "created_at" DESC, "id" DESC);
CREATE INDEX "support_messages_user_idx"
    ON "support_messages"("user_id", "created_at", "id");
CREATE INDEX "support_messages_area_city_idx" ON "support_messages"("area_id", "city_id");

ALTER TABLE "settings" ADD CONSTRAINT "settings_updated_by_fkey"
    FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_updated_by_fkey"
    FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "legal_pages" ADD CONSTRAINT "legal_pages_updated_by_fkey"
    FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_city_id_fkey"
    FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
-- The composite key prevents an area being paired with a different city.
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_area_city_fkey"
    FOREIGN KEY ("area_id", "city_id") REFERENCES "areas"("id", "city_id")
    ON DELETE RESTRICT ON UPDATE RESTRICT;

-- TODO(verify): launch flag values are not approved in the spec; every flag
-- starts disabled (maintenance off) and is enabled by an audited Super Admin save.
INSERT INTO "feature_flags" ("key", "enabled", "version", "updated_by", "updated_at")
SELECT "key", false, 1, NULL, CURRENT_TIMESTAMP
FROM (VALUES ('reviews'), ('guest_browse'), ('whatsapp'), ('booking'), ('donations'),
             ('payments_online'), ('payments_cod'), ('maintenance')) AS "flags"("key");

-- Media "Public image policy" deployment seed: JPEG/PNG/WebP, 5 MiB, edges
-- <= 6000 px, <= 24,000,000 px, purpose minimums/variants/budgets, quality 80/60.
-- Super Admin overrides may only tighten these values.
INSERT INTO "settings" ("key", "value", "version", "updated_by", "updated_at")
SELECT 'uploads',
    jsonb_build_object('purposes', jsonb_object_agg("p"."purpose", jsonb_build_object(
        'version', 1,
        'enabled', true,
        'allowedMimeTypes', jsonb_build_array('image/jpeg', 'image/png', 'image/webp'),
        'maxBytes', 5242880,
        'minWidth', "p"."min_width",
        'minHeight', "p"."min_height",
        'maxWidth', 6000,
        'maxHeight', 6000,
        'maxPixels', 24000000,
        'variants', (SELECT jsonb_agg(jsonb_build_object('width', "w", 'maxBytes', "p"."budget")
                        ORDER BY "w")
                     FROM unnest("p"."widths") AS "w"),
        'quality', 80,
        'minQuality', 60))),
    1, NULL, CURRENT_TIMESTAMP
FROM (VALUES
    ('catalog_taxonomy', 256, 256, ARRAY[160, 320, 640], 122880),
    ('offer_banner', 640, 320, ARRAY[480, 960, 1600, 1920], 358400),
    ('product', 320, 320, ARRAY[320, 640, 1280, 1920], 307200),
    ('service', 320, 320, ARRAY[320, 640, 1280, 1920], 307200),
    ('business_profile_logo', 256, 256, ARRAY[160, 320, 640], 122880),
    ('business_profile_cover', 640, 320, ARRAY[480, 960, 1600, 1920], 358400),
    ('gallery', 320, 320, ARRAY[320, 640, 1280, 1920], 307200),
    ('video_thumbnail', 320, 320, ARRAY[320, 640, 1280, 1920], 307200),
    ('review_photo', 320, 320, ARRAY[320, 640, 1280, 1920], 307200)
) AS "p"("purpose", "min_width", "min_height", "widths", "budget");

-- Keys are fixed by migration/first save; the runtime never deletes configuration.
GRANT SELECT, INSERT ON "settings", "legal_pages" TO apnatown_runtime;
GRANT UPDATE ("value", "version", "updated_by", "updated_at")
    ON "settings" TO apnatown_runtime;
GRANT UPDATE ("title_en", "title_hi", "body_en", "body_hi", "version", "published_at",
    "updated_by") ON "legal_pages" TO apnatown_runtime;
-- Flags are seeded above; the runtime only toggles them.
GRANT SELECT ON "feature_flags" TO apnatown_runtime;
GRANT UPDATE ("enabled", "version", "updated_by", "updated_at")
    ON "feature_flags" TO apnatown_runtime;
-- Support messages are immutable intake records; retention is Q-13/Q-32 gated.
GRANT SELECT, INSERT ON "support_messages" TO apnatown_runtime;

COMMIT;
