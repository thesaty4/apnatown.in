ALTER TABLE hearts ADD COLUMN media_kind text;
ALTER TABLE hearts ADD CONSTRAINT hearts_media_kind_check CHECK (
  media_kind IS NULL OR
  (target_type = 'video' AND media_kind IN ('video', 'reel'))
);

UPDATE hearts h
SET media_kind = CASE WHEN v.provider_kind IN ('shorts', 'reel') THEN 'reel' ELSE 'video' END
FROM videos v
WHERE h.target_type = 'video' AND h.target_id = v.id;

CREATE INDEX hearts_saved_page_idx
  ON hearts (user_id, target_type, created_at DESC, target_id DESC);
CREATE INDEX hearts_saved_kind_page_idx
  ON hearts (user_id, target_type, media_kind, created_at DESC, target_id DESC);
CREATE INDEX follows_saved_page_idx
  ON follows (user_id, last_followed_at DESC, business_id DESC)
  WHERE unfollowed_at IS NULL;

-- Forward repair may rebuild these indexes. Keep media_kind for unavailable
-- targets: dropping it loses their saved video/reel classification.
