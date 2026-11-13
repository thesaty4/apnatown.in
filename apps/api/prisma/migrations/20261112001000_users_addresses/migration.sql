-- Additive saved-address storage; no accounts, addresses or geography are seeded.
-- Recovery: transaction rollback on failure; inspect actual schema/migration state
-- before retrying. Once populated, repair forward or restore an approved backup.
-- Dropping this table destroys private addresses and historical references.
BEGIN;

CREATE TABLE "addresses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "address_text" TEXT NOT NULL,
    "landmark" TEXT,
    "pin_code" TEXT NOT NULL,
    "city_id" UUID NOT NULL,
    "area_id" UUID,
    "location" geography(Point,4326),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "addresses_version_check" CHECK ("version" > 0),
    CONSTRAINT "addresses_label_check"
        CHECK (char_length("label") BETWEEN 1 AND 60 AND "label" !~ '[[:cntrl:]<>]'),
    CONSTRAINT "addresses_pin_code_check" CHECK ("pin_code" ~ '^[0-9]{6}$'),
    -- Application AEAD authenticates the row/user/field context; this only checks the envelope.
    CONSTRAINT "addresses_address_text_encrypted_check"
        CHECK ("address_text" ~ '^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]+$'),
    CONSTRAINT "addresses_landmark_encrypted_check"
        CHECK ("landmark" IS NULL OR "landmark" ~ '^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]+$'),
    CONSTRAINT "addresses_deleted_default_check" CHECK ("deleted_at" IS NULL OR NOT "is_default"),
    CONSTRAINT "addresses_location_check" CHECK ("location" IS NULL OR
        (NOT ST_IsEmpty("location"::geometry) AND ST_IsValid("location"::geometry)
         AND ST_Y("location"::geometry) BETWEEN -90 AND 90
         AND ST_X("location"::geometry) BETWEEN -180 AND 180))
);

CREATE INDEX "addresses_owner_page_idx"
    ON "addresses"("user_id", "deleted_at", "created_at" DESC, "id" DESC);
CREATE UNIQUE INDEX "addresses_live_default_key"
    ON "addresses"("user_id") WHERE "is_default" AND "deleted_at" IS NULL;
CREATE INDEX "addresses_city_id_idx" ON "addresses"("city_id");
CREATE INDEX "addresses_area_city_idx" ON "addresses"("area_id", "city_id");

-- The composite key prevents a valid area ID being paired with a different city.
CREATE UNIQUE INDEX "areas_id_city_id_key" ON "areas"("id", "city_id");
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_city_id_fkey"
    FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_area_city_fkey"
    FOREIGN KEY ("area_id", "city_id") REFERENCES "areas"("id", "city_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

GRANT SELECT, INSERT ON "addresses" TO apnatown_runtime;
-- Ownership, identity and creation time cannot be rewritten by the runtime.
GRANT UPDATE ("label", "address_text", "landmark", "pin_code", "city_id",
    "area_id", "location", "is_default", "version", "deleted_at", "updated_at")
    ON "addresses" TO apnatown_runtime;

COMMIT;
