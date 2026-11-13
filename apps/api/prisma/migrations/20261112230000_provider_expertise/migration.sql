-- Services owns provider expertise (F-PV-002; services BE spec tables
-- provider_expertise / provider_expertise_versions). A provider may map many
-- SERVICE subcategories independently of each service's single subcategory
-- (BR-08). The version row is the aggregate lock for atomic replace-all saves
-- and is versioned independently of the business profile.
-- Runtime may replace mappings (DELETE + INSERT) and bump the version; it can
-- never rewrite the business/subcategory identity of a version row.
-- Recovery is forward repair only; dropping these tables loses owner-entered
-- expertise selections. No seed or backfill: absent rows mean an empty set at
-- version 1.
BEGIN;
CREATE TABLE provider_expertise (
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  subcategory_id uuid NOT NULL REFERENCES subcategories(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT provider_expertise_pkey PRIMARY KEY (business_id,subcategory_id)
);
CREATE INDEX provider_expertise_subcategory_idx ON provider_expertise(subcategory_id,business_id);

CREATE TABLE provider_expertise_versions (
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT provider_expertise_versions_pkey PRIMARY KEY (business_id)
);

GRANT SELECT, INSERT, DELETE ON provider_expertise TO apnatown_runtime;
GRANT SELECT, INSERT ON provider_expertise_versions TO apnatown_runtime;
GRANT UPDATE (version, updated_at) ON provider_expertise_versions TO apnatown_runtime;
COMMIT;
