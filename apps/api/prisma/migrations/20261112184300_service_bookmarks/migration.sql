-- Engagement owns service bookmarks; target IDs intentionally survive target
-- removal so Saved can show an unavailable row and allow its owner to remove it.
-- Forward recovery preserves relationships. Dropping this table loses user data.
BEGIN;
CREATE TABLE bookmarks (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  target_type text NOT NULL CHECK (target_type='service'),
  target_id uuid NOT NULL,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,target_type,target_id)
);
CREATE INDEX bookmarks_saved_page_idx ON bookmarks(user_id,target_type,created_at DESC,target_id DESC);
GRANT SELECT,INSERT,DELETE ON bookmarks TO apnatown_runtime;
COMMIT;
