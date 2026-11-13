-- Additive taxonomy-image slice. Private documents and other purposes remain
-- unavailable. Repair forward after deployment; dropping these tables loses
-- asset identities and the journal needed to reconcile provider objects.
BEGIN;
CREATE TABLE media_assets (
  id uuid PRIMARY KEY,
  owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  purpose text NOT NULL CHECK (purpose = 'catalog_taxonomy'),
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility = 'public'),
  moderation_state text NOT NULL DEFAULT 'allowed' CHECK (moderation_state IN ('allowed','removed')),
  storage_provider text NOT NULL DEFAULT 'cloudinary' CHECK (storage_provider = 'cloudinary'),
  storage_key text NOT NULL UNIQUE,
  mime_type text NOT NULL CHECK (mime_type = 'image/webp'),
  bytes bigint NOT NULL CHECK (bytes > 0),
  width integer NOT NULL CHECK (width BETWEEN 1 AND 6000),
  height integer NOT NULL CHECK (height BETWEEN 1 AND 6000),
  variants jsonb NOT NULL CHECK (jsonb_typeof(variants) = 'array'),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  deleted_at timestamptz(6)
);
CREATE INDEX media_assets_owner_user_id_created_at_id_idx ON media_assets(owner_user_id, created_at, id);
CREATE TABLE media_upload_operations (
  id uuid PRIMARY KEY,
  owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  key_hash text NOT NULL,
  request_hash text NOT NULL,
  policy jsonb NOT NULL,
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','ready','cleaning','failed')),
  lease_id uuid,
  lease_until timestamptz(6),
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  expires_at timestamptz(6) NOT NULL,
  UNIQUE(owner_user_id,key_hash)
);
CREATE INDEX media_upload_operations_state_expires_at_id_idx ON media_upload_operations(state,expires_at,id);
ALTER TABLE categories ADD CONSTRAINT categories_image_asset_id_fkey
  FOREIGN KEY (image_asset_id) REFERENCES media_assets(id) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE subcategories ADD CONSTRAINT subcategories_image_asset_id_fkey
  FOREIGN KEY (image_asset_id) REFERENCES media_assets(id) ON DELETE RESTRICT ON UPDATE RESTRICT;
CREATE INDEX categories_image_asset_id_idx ON categories(image_asset_id);
CREATE INDEX subcategories_image_asset_id_idx ON subcategories(image_asset_id);
GRANT SELECT, INSERT, UPDATE ON media_assets, media_upload_operations TO apnatown_runtime;
COMMIT;
