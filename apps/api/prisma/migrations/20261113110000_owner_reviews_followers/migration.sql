-- Owner reviews + followers (specs/reviews/be/reviews.md F-RV-007, S-VEND-09,
-- S-PROV-10; specs/engagement/be/engagement.md F-VD-015, F-NT-003).
--   * review_reports: one report per reporter subject (spec table); owner
--     "Report abusive" moves published -> reported (stays public/counted).
--   * reviews: runtime may write only the owner reply and report-transition
--     columns (rating/text/author stay untouched).
--   * follower_announcements: owner announcements (latest three shown).
-- Recovery: forward-only; dropping the new tables loses only these rows.
BEGIN;
CREATE TABLE review_reports (
  id uuid PRIMARY KEY,
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE RESTRICT,
  reporter_user_id uuid NULL REFERENCES users(id) ON DELETE RESTRICT,
  reporter_subject_hash bytea NOT NULL,
  reason text NOT NULL CHECK (reason IN ('abusive', 'spam', 'fake', 'other')),
  details text NULL CHECK (details IS NULL OR char_length(details) <= 500),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  resolved_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT review_reports_subject_key UNIQUE (review_id, reporter_subject_hash)
);
CREATE INDEX review_reports_review_status_idx ON review_reports (review_id, status);

CREATE TABLE follower_announcements (
  id uuid PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  kind text NOT NULL CHECK (kind IN ('product', 'service', 'offer', 'video')),
  target_id uuid NULL,
  source text NOT NULL CHECK (source IN ('automatic_first_publication', 'owner_announcement')),
  source_event_id uuid NULL UNIQUE,
  message_en text NULL CHECK (message_en IS NULL OR char_length(message_en) <= 200),
  message_hi text NULL CHECK (message_hi IS NULL OR char_length(message_hi) <= 200),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX follower_announcements_recent_idx
  ON follower_announcements (business_id, created_at DESC, id DESC);

GRANT SELECT, INSERT ON review_reports TO apnatown_runtime;
GRANT UPDATE (owner_reply, owner_replied_at, status, version, updated_at)
  ON reviews TO apnatown_runtime;
GRANT SELECT, INSERT ON follower_announcements TO apnatown_runtime;
COMMIT;
