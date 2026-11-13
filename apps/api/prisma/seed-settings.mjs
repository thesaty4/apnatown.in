// Local demo-only platform settings that no migration seeds. Insert-only, so
// a value already saved by a Super Admin is never overwritten.
// TODO(verify): Q-47 launch caps; these exist only so local demo owners can
// exercise CSV/XLSX import (shared hard ceilings: 1000 rows, 2 MiB).
const LOCAL_PRODUCT_IMPORT = Object.freeze({
  enabled: true,
  maxRows: 200,
  maxBytes: 1048576,
});

export async function seedLocalSettings(client, at, counts) {
  const { rowCount } = await client.query(
    `INSERT INTO settings (key, value, version, updated_by, updated_at)
     VALUES ('product_import', $1::jsonb, 1, NULL, $2::timestamptz)
     ON CONFLICT (key) DO NOTHING`,
    [JSON.stringify(LOCAL_PRODUCT_IMPORT), at.toISOString()],
  );
  counts.settings += rowCount;
}
