-- Frozen, per-session Reels rankings. Recovery is forward-only: repair with
-- a reviewed migration; dropping this table only discards feed snapshots.
BEGIN;
CREATE TABLE reel_rank_snapshots (
  id uuid PRIMARY KEY,
  session_subject_hash bytea NOT NULL,
  ranked_items jsonb NOT NULL,
  created_at timestamptz(6) NOT NULL,
  expires_at timestamptz(6) NOT NULL,
  CONSTRAINT reel_rank_snapshots_expiry_check
    CHECK (expires_at > created_at)
);
CREATE INDEX reel_rank_snapshots_subject_expiry_idx
  ON reel_rank_snapshots (session_subject_hash, expires_at);
CREATE INDEX reel_rank_snapshots_expiry_idx
  ON reel_rank_snapshots (expires_at);
GRANT SELECT, INSERT, DELETE ON reel_rank_snapshots TO apnatown_runtime;
COMMIT;
