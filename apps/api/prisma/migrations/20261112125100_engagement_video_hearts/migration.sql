CREATE TABLE hearts (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  target_type text NOT NULL CHECK (target_type IN ('photo', 'video')),
  target_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hearts_pkey PRIMARY KEY (user_id, target_type, target_id)
);

CREATE INDEX hearts_user_created_target_idx
  ON hearts (user_id, created_at DESC, target_id);

-- Recovery is additive: rebuild caller-owned heart rows from a backup.
-- Dropping the table loses saved relationships; do not treat that as rollback.
