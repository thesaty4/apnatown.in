CREATE TABLE follows (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  bell_on boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_followed_at timestamptz NOT NULL DEFAULT now(),
  unfollowed_at timestamptz,
  CONSTRAINT follows_pkey PRIMARY KEY (user_id, business_id)
);

CREATE INDEX follows_business_user_active_idx
  ON follows (business_id, user_id)
  WHERE unfollowed_at IS NULL;

CREATE INDEX follows_user_active_idx
  ON follows (user_id)
  WHERE unfollowed_at IS NULL;

-- Recovery is additive: restore follow rows from a backup if this table is
-- accidentally removed. Do not drop the table as an automatic rollback.
