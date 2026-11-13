-- The engagement migrations created these tables without runtime grants, so
-- every Reels feed, like, heart, follow, share and comment query failed with
-- "permission denied" under apnatown_runtime. Grants mirror repository use:
-- SELECT ... FOR UPDATE needs the column UPDATE grants below.
-- Recovery: forward-only; a reviewed migration can REVOKE. No data changes.
BEGIN;

-- Like/heart toggles insert or hard-delete the caller's own relationship row.
GRANT SELECT, INSERT, DELETE ON likes, hearts TO apnatown_runtime;

-- Counter rows are created lazily and incremented; never deleted by runtime.
GRANT SELECT, INSERT ON video_engagement_counts TO apnatown_runtime;
GRANT UPDATE (like_count, share_count, version, updated_at)
  ON video_engagement_counts TO apnatown_runtime;

-- Unfollow is a soft delete (unfollowed_at); keys and created_at are fixed.
GRANT SELECT, INSERT ON follows TO apnatown_runtime;
GRANT UPDATE (bell_on, last_followed_at, unfollowed_at)
  ON follows TO apnatown_runtime;

-- Comments are moderated/removed by status, never deleted or re-authored.
GRANT SELECT, INSERT ON video_comments TO apnatown_runtime;
GRANT UPDATE (status, removed_reason, version, updated_at)
  ON video_comments TO apnatown_runtime;

COMMIT;
