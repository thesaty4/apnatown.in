-- Persist guest-safe photo/video reports for the scoped media queue.
-- Recovery is forward-only. Dropping this table removes reports and moderation
-- history; production data loss requires explicit human approval.
BEGIN;

CREATE TABLE media_reports (
  id uuid PRIMARY KEY,
  target_kind text NOT NULL CHECK (target_kind IN ('photo', 'video')),
  asset_id uuid REFERENCES media_assets(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  video_id uuid REFERENCES videos(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  placement_type text CHECK (placement_type IN ('gallery_photo', 'product_image', 'service_image')),
  placement_id uuid,
  reporter_user_id uuid REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  reporter_subject_hash bytea NOT NULL,
  reason text NOT NULL CHECK (reason IN ('inappropriate', 'misleading', 'spam', 'copyright', 'other')),
  details text CHECK (details IS NULL OR char_length(details) <= 500),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  resolution text CHECK (resolution IN ('dismissed', 'removed')),
  resolved_at timestamptz(6),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT media_reports_target_check CHECK (
    (target_kind = 'video' AND video_id IS NOT NULL AND asset_id IS NULL
      AND placement_type IS NULL AND placement_id IS NULL)
    OR
    (target_kind = 'photo' AND asset_id IS NOT NULL AND video_id IS NULL
      AND placement_type IS NOT NULL AND placement_id IS NOT NULL)
  ),
  CONSTRAINT media_reports_resolution_state_check CHECK (
    (status = 'open' AND resolution IS NULL AND resolved_at IS NULL)
    OR (status = 'resolved' AND resolution IS NOT NULL AND resolved_at IS NOT NULL)
  )
);

CREATE INDEX media_reports_business_status_page_idx
  ON media_reports (business_id, status, created_at DESC, id DESC);
CREATE INDEX media_reports_asset_status_idx
  ON media_reports (asset_id, status) WHERE asset_id IS NOT NULL;
CREATE INDEX media_reports_video_status_idx
  ON media_reports (video_id, status) WHERE video_id IS NOT NULL;
CREATE UNIQUE INDEX media_reports_open_video_subject_key
  ON media_reports (video_id, reporter_subject_hash)
  WHERE target_kind = 'video' AND status = 'open';

GRANT SELECT, INSERT, UPDATE ON media_reports TO apnatown_runtime;

COMMIT;
