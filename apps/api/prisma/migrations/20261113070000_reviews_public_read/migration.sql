-- Reviews public read (specs/reviews/be/reviews.md, GET /reviews): keyset
-- indexes for the two allow-listed sorts over the publicly visible set
-- (published/reported, not deleted). No rows are read-modified; runtime
-- already has SELECT on reviews. Recovery: forward-only; dropping these
-- indexes loses no data.
BEGIN;
CREATE INDEX reviews_public_recent_idx
  ON reviews (target_type, target_id, created_at DESC, id DESC)
  WHERE status IN ('published', 'reported') AND deleted_at IS NULL;
CREATE INDEX reviews_public_helpful_idx
  ON reviews (target_type, target_id, helpful_count DESC, created_at DESC, id DESC)
  WHERE status IN ('published', 'reported') AND deleted_at IS NULL;
COMMIT;
