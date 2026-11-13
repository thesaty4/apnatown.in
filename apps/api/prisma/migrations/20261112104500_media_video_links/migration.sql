-- Link-only YouTube/Instagram video records. Recovery is forward-only: repair
-- with a reviewed migration; dropping this table removes submitted media and
-- moderation history, so production data loss requires human approval.
BEGIN;
CREATE TABLE videos (
  id uuid PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  source text NOT NULL CHECK (source IN ('youtube','instagram')),
  provider_kind text NOT NULL,
  provider_video_id text NOT NULL,
  caption text NOT NULL DEFAULT '' CHECK (char_length(caption) <= 300),
  hashtags text[] NOT NULL DEFAULT '{}' CHECK (cardinality(hashtags) <= 10),
  show_in_gallery boolean NOT NULL DEFAULT false,
  show_in_reels boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','removed')),
  decision_reason text,
  approved_at timestamptz(6),
  owner_deleted_at timestamptz(6),
  sort_order integer NOT NULL DEFAULT 0,
  view_count bigint NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  like_count bigint NOT NULL DEFAULT 0 CHECK (like_count >= 0),
  comment_count bigint NOT NULL DEFAULT 0 CHECK (comment_count >= 0),
  share_count bigint NOT NULL DEFAULT 0 CHECK (share_count >= 0),
  engagement_version bigint NOT NULL DEFAULT 0 CHECK (engagement_version >= 0),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT videos_source_kind_id_check CHECK (
    (source = 'youtube'
      AND provider_kind IN ('watch','shorts','share')
      AND provider_video_id ~ '^[A-Za-z0-9_-]{11}$')
    OR
    (source = 'instagram'
      AND provider_kind IN ('reel','p')
      AND provider_video_id ~ '^[A-Za-z0-9_-]{1,64}$')
  )
);
CREATE INDEX videos_public_candidates_idx
  ON videos (status, show_in_reels, id);
CREATE INDEX videos_moderation_page_idx
  ON videos (status, created_at DESC, id DESC);
CREATE INDEX videos_business_page_idx
  ON videos (business_id, created_at DESC, id DESC);
CREATE INDEX videos_business_order_idx
  ON videos (business_id, sort_order, id);
GRANT SELECT, INSERT, UPDATE ON videos TO apnatown_runtime;
COMMIT;
