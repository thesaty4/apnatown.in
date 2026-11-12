-- Read foundations owned by Reviews, Payments and Offers. No checkout, billing
-- activation, moderation or approval write API is enabled. Never seed eligibility.
-- Forward recovery must preserve paid evidence and reviews; no automatic down.
BEGIN;
CREATE TABLE reviews (
  id uuid PRIMARY KEY, target_type text NOT NULL CHECK (target_type IN ('business','product','service','rider')),
  target_id uuid NOT NULL, business_id uuid REFERENCES businesses(id),
  author_user_id uuid NOT NULL REFERENCES users(id),
  eligibility_ref_type text NOT NULL CHECK (eligibility_ref_type IN ('order','enquiry')),
  eligibility_ref_id uuid NOT NULL, eligibility_policy_version text,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text text NOT NULL CHECK (length(btrim(text)) BETWEEN 1 AND 1000),
  tags text[] NOT NULL DEFAULT '{}', photo_asset_ids uuid[] NOT NULL DEFAULT '{}',
  status text NOT NULL CHECK (status IN ('pending','published','reported','hidden','deleted')),
  moderation_reason text, helpful_count integer NOT NULL DEFAULT 0 CHECK (helpful_count >= 0),
  owner_reply text CHECK (length(owner_reply) <= 1000), owner_replied_at timestamptz,
  version integer NOT NULL DEFAULT 1, deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reviews_public_rating_idx ON reviews(target_type,target_id,rating,id) WHERE status='published' AND deleted_at IS NULL;
CREATE INDEX reviews_business_idx ON reviews(business_id,status,created_at DESC,id DESC);
CREATE INDEX reviews_author_idx ON reviews(author_user_id,created_at DESC,id DESC);
CREATE TABLE billing_purchases (
  id uuid PRIMARY KEY, business_id uuid NOT NULL REFERENCES businesses(id),
  initiated_by uuid NOT NULL REFERENCES users(id), kind text NOT NULL CHECK (kind IN ('plan','promotion')),
  target_key text NOT NULL, prepared_placement_id uuid,
  amount_paise bigint NOT NULL CHECK (amount_paise BETWEEN 0 AND 9007199254740991),
  configuration_version text NOT NULL, configuration_snapshot jsonb NOT NULL,
  period_snapshot jsonb NOT NULL, status text NOT NULL CHECK
    (status IN ('pending','succeeded','failed','reconciliation_required','compensating','compensated')),
  idempotency_key text NOT NULL, request_hash text NOT NULL, version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(initiated_by,idempotency_key)
);
CREATE INDEX billing_purchases_business_idx ON billing_purchases(business_id,created_at DESC,id DESC);
CREATE TABLE business_subscription_versions (
  business_id uuid PRIMARY KEY REFERENCES businesses(id), version integer NOT NULL DEFAULT 1 CHECK (version > 0)
);
CREATE TABLE business_subscriptions (
  id uuid PRIMARY KEY, business_id uuid NOT NULL REFERENCES businesses(id), plan_key text NOT NULL,
  -- Narrow evidence link to the verified billing purchase; payment attempt
  -- persistence remains Payments' checkout implementation, not a discovery table.
  purchase_id uuid UNIQUE REFERENCES billing_purchases(id), plan_snapshot jsonb,
  starts_at timestamptz NOT NULL, ends_at timestamptz,
  cancellation_requested_at timestamptz, version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_subscriptions_interval CHECK (ends_at IS NULL OR ends_at > starts_at)
);
CREATE INDEX business_subscriptions_period_idx ON business_subscriptions(business_id,starts_at,ends_at,id);
CREATE TABLE offers (
  id uuid PRIMARY KEY, business_id uuid NOT NULL REFERENCES businesses(id),
  title_en text NOT NULL, title_hi text, terms_en text, terms_hi text,
  discount_type text NOT NULL CHECK (discount_type IN ('percent','flat','free_delivery')),
  discount_percent smallint CHECK (discount_percent BETWEEN 1 AND 100),
  discount_paise bigint CHECK (discount_paise BETWEEN 0 AND 9007199254740991),
  scope text NOT NULL CHECK (scope IN ('business','targets')),
  valid_from timestamptz NOT NULL, valid_to timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','paused','ended')),
  review_decision text CHECK (review_decision IN ('approved','rejected')),
  reviewed_by uuid REFERENCES users(id), reviewed_at timestamptz, first_approved_at timestamptz,
  rejection_reason text, featured boolean NOT NULL DEFAULT false,
  banner_asset_id uuid REFERENCES media_assets(id), views_count bigint NOT NULL DEFAULT 0,
  uses_count bigint NOT NULL DEFAULT 0, version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT offers_interval CHECK (valid_to > valid_from),
  CONSTRAINT offers_discount_shape CHECK (
    (discount_type='percent' AND discount_percent IS NOT NULL AND discount_paise IS NULL) OR
    (discount_type='flat' AND discount_paise IS NOT NULL AND discount_percent IS NULL) OR
    (discount_type='free_delivery' AND discount_percent IS NULL AND discount_paise IS NULL))
);
CREATE INDEX offers_public_idx ON offers(business_id,valid_from,valid_to,id) WHERE status='active' AND review_decision='approved';
CREATE INDEX offers_reviewer_idx ON offers(reviewed_by);
CREATE INDEX offers_banner_idx ON offers(banner_asset_id);
CREATE TABLE offer_targets (
  id uuid PRIMARY KEY, offer_id uuid NOT NULL REFERENCES offers(id),
  target_kind text NOT NULL CHECK (target_kind IN ('product','service')),
  product_id uuid REFERENCES products(id), service_id uuid REFERENCES services(id),
  CONSTRAINT offer_targets_shape CHECK (
    (target_kind='product' AND product_id IS NOT NULL AND service_id IS NULL) OR
    (target_kind='service' AND service_id IS NOT NULL AND product_id IS NULL))
);
CREATE UNIQUE INDEX offer_targets_product_key ON offer_targets(offer_id,product_id) WHERE product_id IS NOT NULL;
CREATE UNIQUE INDEX offer_targets_service_key ON offer_targets(offer_id,service_id) WHERE service_id IS NOT NULL;
CREATE INDEX offer_targets_product_idx ON offer_targets(product_id,offer_id);
CREATE INDEX offer_targets_service_idx ON offer_targets(service_id,offer_id);
CREATE TABLE promotion_placements (
  id uuid PRIMARY KEY, kind text NOT NULL CHECK (kind IN ('homepage_banner','featured_business')),
  surface text NOT NULL CHECK (surface IN ('hero_banner','featured_business','local_promotion')),
  source text NOT NULL CHECK (source IN ('admin','purchase')), business_id uuid REFERENCES businesses(id),
  purchase_id uuid UNIQUE REFERENCES billing_purchases(id), promotion_key text,
  scope_kind text NOT NULL CHECK (scope_kind IN ('platform','city','area')),
  city_id uuid REFERENCES cities(id), area_id uuid, title_en text, title_hi text,
  subtitle_en text, subtitle_hi text, banner_asset_id uuid REFERENCES media_assets(id), destination jsonb,
  position integer NOT NULL DEFAULT 0 CHECK (position >= 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','ended')),
  starts_at timestamptz, ends_at timestamptz, configuration_version text, activation_blocked_reason text,
  created_by uuid NOT NULL REFERENCES users(id), updated_by uuid NOT NULL REFERENCES users(id),
  version integer NOT NULL DEFAULT 1, deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(area_id,city_id) REFERENCES areas(id,city_id),
  CONSTRAINT promotion_placements_interval CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at),
  CONSTRAINT promotion_placements_scope CHECK (
    (scope_kind='platform' AND city_id IS NULL AND area_id IS NULL) OR
    (scope_kind='city' AND city_id IS NOT NULL AND area_id IS NULL) OR
    (scope_kind='area' AND city_id IS NOT NULL AND area_id IS NOT NULL))
);
ALTER TABLE billing_purchases ADD CONSTRAINT billing_purchases_prepared_placement_fk
  FOREIGN KEY(prepared_placement_id) REFERENCES promotion_placements(id);
CREATE INDEX billing_purchases_placement_idx ON billing_purchases(prepared_placement_id);
CREATE INDEX promotion_placements_business_idx ON promotion_placements(business_id,status,starts_at,ends_at,id);
CREATE INDEX promotion_placements_scope_idx ON promotion_placements(city_id,area_id,status,position,id);
CREATE INDEX promotion_placements_area_idx ON promotion_placements(area_id,city_id);
CREATE INDEX promotion_placements_creator_idx ON promotion_placements(created_by);
CREATE INDEX promotion_placements_updater_idx ON promotion_placements(updated_by);
CREATE INDEX promotion_placements_banner_idx ON promotion_placements(banner_asset_id);
GRANT SELECT ON reviews,billing_purchases,business_subscriptions,business_subscription_versions,
  offers,offer_targets,promotion_placements TO apnatown_runtime;
COMMIT;
