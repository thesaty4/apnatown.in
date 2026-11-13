ALTER TABLE video_engagement_counts
  ADD COLUMN share_count bigint NOT NULL DEFAULT 0
  CHECK (share_count >= 0);

-- Recovery is additive: rebuild from committed engagement.shared outbox events.
-- No existing relationship data is removed; do not drop the column as rollback.
