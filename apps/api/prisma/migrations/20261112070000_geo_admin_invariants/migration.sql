-- Geo super-admin write invariants (F-SA-004). Constraint-only and additive:
-- no cities, areas, zones, GST codes, polygons or fee defaults are seeded.
-- Constraints are added NOT VALID and then validated so a populated table
-- fails loudly here instead of being silently rewritten. Repair offending
-- rows forward (rename the slug/name through the audited admin API or a
-- reviewed data migration) and re-run; there is no destructive down path.
BEGIN;

-- City slugs are server-derived from nameEn: lowercase ASCII words joined
-- by single hyphens.
ALTER TABLE "cities" ADD CONSTRAINT "cities_slug_format_check"
    CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length("slug") <= 80) NOT VALID;
ALTER TABLE "cities" ADD CONSTRAINT "cities_names_check"
    CHECK (
        char_length(btrim("name_en")) BETWEEN 1 AND 60
        AND char_length(btrim("name_hi")) BETWEEN 1 AND 60
    ) NOT VALID;
ALTER TABLE "zones" ADD CONSTRAINT "zones_name_check"
    CHECK (char_length(btrim("name")) BETWEEN 1 AND 80) NOT VALID;
-- Fee slab distances fit numeric(5,2); paise stay within the JS safe range.
ALTER TABLE "zone_fee_slabs" ADD CONSTRAINT "zone_fee_slabs_fee_range_check"
    CHECK ("fee_paise" <= 9007199254740991) NOT VALID;

ALTER TABLE "cities" VALIDATE CONSTRAINT "cities_slug_format_check";
ALTER TABLE "cities" VALIDATE CONSTRAINT "cities_names_check";
ALTER TABLE "zones" VALIDATE CONSTRAINT "zones_name_check";
ALTER TABLE "zone_fee_slabs" VALIDATE CONSTRAINT "zone_fee_slabs_fee_range_check";

-- Super-admin city detail lists zones by name within a city.
CREATE INDEX "zones_city_name_id_idx" ON "zones"("city_id", "name", "id");

-- Runtime grants are unchanged: cities/areas SELECT/INSERT/UPDATE, zones and
-- slabs SELECT/INSERT/UPDATE/DELETE, waitlist SELECT/INSERT (granted in
-- 20261111180124_geo_storage). Re-assert them idempotently for this slice.
GRANT SELECT, INSERT, UPDATE ON "cities", "areas" TO apnatown_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON "zones", "zone_fee_slabs" TO apnatown_runtime;
GRANT SELECT, INSERT ON "service_area_waitlist" TO apnatown_runtime;

COMMIT;
