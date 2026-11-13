-- Additive Geo storage. No locations, GST codes, polygons or fee defaults are
-- invented or seeded. Repair populated tables forward; no destructive down path.
BEGIN;

CREATE TABLE "cities" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_hi" TEXT NOT NULL,
    "state_code" CHAR(2) NOT NULL,
    "status" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cities_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "cities_status_check" CHECK ("status" IN ('enabled', 'disabled', 'coming_soon')),
    CONSTRAINT "cities_version_check" CHECK ("version" > 0),
    CONSTRAINT "cities_state_code_check" CHECK ("state_code" ~ '^[0-9]{2}$')
);

CREATE TABLE "areas" (
    "id" UUID NOT NULL,
    "city_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_hi" TEXT NOT NULL,
    "pin_code" TEXT,
    "centroid" geography(Point,4326),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "areas_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "areas_pin_code_check" CHECK ("pin_code" IS NULL OR "pin_code" ~ '^[0-9]{6}$')
);

CREATE TABLE "zones" (
    "id" UUID NOT NULL,
    "city_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "polygon" geometry(Polygon,4326) NOT NULL,
    "status" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "zones_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "zones_status_check" CHECK ("status" IN ('active', 'paused')),
    CONSTRAINT "zones_version_check" CHECK ("version" > 0),
    CONSTRAINT "zones_polygon_check" CHECK (
        NOT ST_IsEmpty("polygon") AND ST_IsValid("polygon")
        AND ST_XMin(Box2D("polygon")) >= -180
        AND ST_XMax(Box2D("polygon")) <= 180
        AND ST_YMin(Box2D("polygon")) >= -90
        AND ST_YMax(Box2D("polygon")) <= 90
    )
);

CREATE TABLE "zone_fee_slabs" (
    "zone_id" UUID NOT NULL,
    "sequence" SMALLINT NOT NULL,
    "upper_distance_km" DECIMAL(5,2) NOT NULL,
    "fee_paise" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "zone_fee_slabs_pkey" PRIMARY KEY ("zone_id", "sequence"),
    CONSTRAINT "zone_fee_slabs_sequence_check" CHECK ("sequence" BETWEEN 1 AND 3),
    CONSTRAINT "zone_fee_slabs_distance_check" CHECK ("upper_distance_km" >= 0),
    CONSTRAINT "zone_fee_slabs_fee_check" CHECK ("fee_paise" >= 0)
);

CREATE TABLE "service_area_waitlist" (
    "id" UUID NOT NULL,
    "city_id" UUID,
    "phone_ciphertext" TEXT NOT NULL,
    "phone_lookup_hash" BYTEA NOT NULL,
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_area_waitlist_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cities_slug_key" ON "cities"("slug");
CREATE INDEX "cities_status_name_en_id_idx" ON "cities"("status", "name_en", "id");
CREATE INDEX "areas_city_name_en_id_idx" ON "areas"("city_id", "name_en", "id");
CREATE INDEX "areas_city_pin_code_idx" ON "areas"("city_id", "pin_code");
CREATE UNIQUE INDEX "areas_city_slug_key" ON "areas"("city_id", "slug");
CREATE INDEX "zones_polygon_idx" ON "zones" USING GIST ("polygon");
CREATE INDEX "zones_city_status_idx" ON "zones"("city_id", "status");
CREATE UNIQUE INDEX "zone_fee_slabs_zone_distance_key" ON "zone_fee_slabs"("zone_id", "upper_distance_km");
CREATE INDEX "service_area_waitlist_city_requested_at_idx"
    ON "service_area_waitlist"("city_id", "requested_at" DESC);

ALTER TABLE "areas" ADD CONSTRAINT "areas_city_id_fkey"
    FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "zones" ADD CONSTRAINT "zones_city_id_fkey"
    FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "zone_fee_slabs" ADD CONSTRAINT "zone_fee_slabs_zone_id_fkey"
    FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE CASCADE ON UPDATE RESTRICT;
ALTER TABLE "service_area_waitlist" ADD CONSTRAINT "service_area_waitlist_city_id_fkey"
    FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

GRANT SELECT, INSERT, UPDATE ON "cities", "areas" TO apnatown_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON "zones", "zone_fee_slabs" TO apnatown_runtime;
GRANT SELECT, INSERT ON "service_area_waitlist" TO apnatown_runtime;

COMMIT;
