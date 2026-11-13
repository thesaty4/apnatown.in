-- Admin owns listing reports (F-PF-007, S-ADMN-03; admin BE spec table
-- `listing_reports`). A guest or signed-in customer reports a public shop or
-- provider listing; authorized Listings admins (catalog:view/edit over the
-- report's stored city/area) read and resolve it.
-- Privacy: the reporter is identified only by a keyed server-side subject
-- hash (never returned) and an optional user link; `details` is inert
-- reporter text that never enters events or logs (BR-14). The city/area are
-- copied from the listing's trusted stored scope at intake.
-- One open report per (listing, reporter subject): a duplicate returns the
-- same report. Runtime may insert reports and resolve them only; it can never
-- rewrite the target, reporter, reason, details or scope.
-- Recovery is forward repair only; no seed or backfill.
BEGIN;
CREATE TABLE listing_reports (
  id uuid NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  reporter_user_id uuid REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  reporter_subject_hash bytea NOT NULL,
  reason text NOT NULL,
  details text,
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  area_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'open',
  resolution text,
  resolution_note text,
  resolved_by uuid REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  resolved_at timestamptz(6),
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT listing_reports_pkey PRIMARY KEY (id),
  -- The composite key prevents an area being paired with a different city.
  CONSTRAINT listing_reports_area_city_fkey FOREIGN KEY (area_id, city_id)
    REFERENCES areas(id, city_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT listing_reports_target_type_allowed CHECK (target_type IN ('business','provider')),
  CONSTRAINT listing_reports_reason_allowed CHECK (reason IN ('fake','wrong','abuse','closed')),
  CONSTRAINT listing_reports_details_length CHECK (details IS NULL OR char_length(details) BETWEEN 1 AND 500),
  CONSTRAINT listing_reports_subject_hash_length CHECK (octet_length(reporter_subject_hash) = 32),
  CONSTRAINT listing_reports_status_allowed CHECK (status IN ('open','resolved')),
  CONSTRAINT listing_reports_resolution_allowed CHECK (resolution IS NULL OR resolution IN ('dismissed','action_taken')),
  CONSTRAINT listing_reports_resolution_note_length CHECK (resolution_note IS NULL OR char_length(resolution_note) BETWEEN 1 AND 500),
  CONSTRAINT listing_reports_version_positive CHECK (version >= 1),
  -- An open report carries no resolution; a resolved one records who/when/how.
  CONSTRAINT listing_reports_resolution_state CHECK (
    (status = 'open' AND resolution IS NULL AND resolution_note IS NULL
      AND resolved_by IS NULL AND resolved_at IS NULL)
    OR (status = 'resolved' AND resolution IS NOT NULL
      AND resolved_by IS NOT NULL AND resolved_at IS NOT NULL))
);
-- Duplicate open reports from one subject return the same report.
CREATE UNIQUE INDEX listing_reports_open_subject_key
  ON listing_reports(target_id, reporter_subject_hash) WHERE status = 'open';
-- Listings reports queue (area grants) and whole-city grants: newest-first keyset.
CREATE INDEX listing_reports_area_queue_idx ON listing_reports(area_id,status,created_at DESC,id DESC);
CREATE INDEX listing_reports_city_queue_idx ON listing_reports(city_id,status,created_at DESC,id DESC);
-- Per-listing open counts and detail pages.
CREATE INDEX listing_reports_target_idx ON listing_reports(target_id,status,created_at DESC,id DESC);
-- Foreign-key indexes (user data requests, resolver).
CREATE INDEX listing_reports_reporter_idx ON listing_reports(reporter_user_id);
CREATE INDEX listing_reports_resolved_by_idx ON listing_reports(resolved_by);

GRANT SELECT, INSERT ON listing_reports TO apnatown_runtime;
GRANT UPDATE (status, resolution, resolution_note, resolved_by, resolved_at, version, updated_at)
  ON listing_reports TO apnatown_runtime;
COMMIT;
