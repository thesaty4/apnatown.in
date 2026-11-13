import { FIXTURE_CLOCK } from './seed-fixtures.mjs';

// LOCAL/TEST only. The design-context sample pack configures each shop's
// fulfilment (`del`: rider|self, radius km, flat fee, minimum, pickup, note)
// and `cfg.cod: true`, but the earlier listing seed left business fulfilment
// unset, so no checkout could be quoted locally. Fill ONLY untouched seeded
// rows (still at the fixture clock with nothing configured); an owner/admin
// edit is never overwritten. Rider mode never stores a flat fee (Geo slabs
// price platform delivery).
const METHOD = Object.freeze({ rider: 'apna_town_rider', self: 'self' });

async function fillFulfilment(client, context) {
  let rows = 0;
  for (const entry of [...(context.sample.biz ?? []), ...(context.sample.svc ?? [])]) {
    const businessId = context.businesses.get(entry.id);
    const del = entry.del;
    const method = METHOD[del?.mode];
    if (!businessId || !method || !Number.isFinite(del.radius) || !Number.isInteger(del.min)) continue;
    if (method === 'self' && !Number.isInteger(del.fee)) continue;
    const note = typeof del.note === 'string' && del.note.trim() ? del.note.trim().slice(0, 300) : null;
    const { rowCount } = await client.query(
      `UPDATE business_settings SET delivery_method = $2, delivery_radius_km = $3,
         delivery_fee_paise = $4, minimum_order_paise = $5, pickup_enabled = $6,
         pickup_instructions = $7, updated_at = $8
       WHERE business_id = $1::uuid AND delivery_method IS NULL AND delivery_radius_km IS NULL
         AND delivery_fee_paise IS NULL AND minimum_order_paise IS NULL AND NOT pickup_enabled
         AND pickup_instructions IS NULL AND updated_at = $8 AND created_at = $8`,
      [businessId, method, del.radius, method === 'self' ? del.fee * 100 : null, del.min * 100,
        del.pickup === true, note, FIXTURE_CLOCK],
    );
    rows += rowCount;
  }
  return rows;
}

// cfg.cod = true: enable the COD flag only while it is still the untouched
// migration default (version 1, no updater). A Super Admin choice wins.
async function enableCod(client, context) {
  if (context.sample.cfg?.cod !== true) return 0;
  const { rowCount } = await client.query(
    `UPDATE feature_flags SET enabled = true, version = version + 1, updated_at = now()
     WHERE key = 'payments_cod' AND NOT enabled AND version = 1 AND updated_by IS NULL`,
  );
  return rowCount;
}

// cfg.riderBase / cfg.riderPerKm (rupees) -> `rider_earning` (paise), so local
// platform-rider jobs can snapshot an estimate/earning (delivery BE rule 12).
// Insert-only: a Super Admin value is never overwritten.
// TODO(verify): production rider earning policy needs approval.
async function seedRiderEarning(client, context) {
  const { riderBase, riderPerKm } = context.sample.cfg ?? {};
  if (!Number.isInteger(riderBase) || !Number.isInteger(riderPerKm)) return 0;
  const { rowCount } = await client.query(
    `INSERT INTO settings (key, value, version, updated_by, updated_at)
     VALUES ('rider_earning', $1::jsonb, 1, NULL, $2::timestamptz)
     ON CONFLICT (key) DO NOTHING`,
    [JSON.stringify({ basePaise: riderBase * 100, perKmPaise: riderPerKm * 100 }), FIXTURE_CLOCK],
  );
  return rowCount;
}

export async function seedOrderSettings(client, context) {
  return {
    business_fulfilment_settings: await fillFulfilment(client, context),
    feature_flag_payments_cod: await enableCod(client, context),
    settings_rider_earning: await seedRiderEarning(client, context),
  };
}
