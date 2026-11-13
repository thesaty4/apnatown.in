CREATE TABLE likes (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT likes_pkey PRIMARY KEY (user_id, video_id)
);
CREATE INDEX likes_video_id_idx ON likes(video_id);

CREATE TABLE video_engagement_counts (
  video_id uuid PRIMARY KEY REFERENCES videos(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  like_count bigint NOT NULL DEFAULT 0 CHECK (like_count >= 0),
  version bigint NOT NULL DEFAULT 1 CHECK (version >= 1),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Additive EG4 slice; comment/share counters are added by their projection work.
-- Recovery: forward repair preserves likes and rebuilds like_count from likes.
-- Dropping either table loses relationship/counter history; restore from backup
-- rather than treating a destructive down migration as recovery.
