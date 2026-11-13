-- Additive, reviewed extension enablement; no application rows are changed.
-- Recovery: inspect extension ownership/state and repair forward. Do not drop
-- extensions or mark a partially applied migration successful without review.
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
