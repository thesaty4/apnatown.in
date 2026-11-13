import { FIXTURE_CLOCK } from './seed-fixtures.mjs';
import { seedReference } from './seed-context.mjs';
import { assertSeed, checked } from './seed-commerce-support.mjs';

async function seedDraft(client, context, business, schema) {
  const businessId = seedReference(context.businesses, business.key);
  assertSeed(typeof business.nameEn === 'string' && typeof business.address === 'string');
  // An explicitly synthetic, UNREVIEWED declaration, not a supplier tax
  // snapshot. No GSTIN, signing/evidence reference, IRN assertion or approval.
  // BillingDraftSchema matches the actual repository/read DTO; storing a
  // SupplierTaxProfile here would incorrectly invent verified fiscal fields.
  const draft = checked(schema, {
    legalName: `LOCAL/TEST demo — ${business.nameEn}`,
    address: `Synthetic billing address — ${business.address}`,
    stateCode: context.fixtures.city.stateCode,
    registrationMode: 'unregistered',
  });
  return client.query(
    `INSERT INTO business_billing_profiles
       (business_id, draft, review_status, version, created_at, updated_at)
     VALUES ($1::uuid, $2::jsonb, 'pending', 1, $3, $3)
     ON CONFLICT DO NOTHING`,
    [businessId, JSON.stringify(draft), FIXTURE_CLOCK],
  );
}

export async function seedCommerceBilling(client, context, schemas, counts) {
  for (const business of context.fixtures.businesses) {
    const businessId = seedReference(context.businesses, business.key);
    const result = await client.query(
      `INSERT INTO business_subscription_versions (business_id, version)
       VALUES ($1::uuid, 1) ON CONFLICT DO NOTHING`,
      [businessId],
    );
    counts.business_subscription_versions += result.rowCount;
    const draft = await seedDraft(
      client, context, business, schemas.businesses.BillingDraftSchema,
    );
    counts.business_billing_profiles += draft.rowCount;
  }
  // Payments' launch policy: Basic is non-Premium and needs no payment/expiry
  // row. A paid subscription requires verified purchase evidence. Even a
  // pending purchase requires a reviewed configuration/tax/period snapshot;
  // the sample has prices only, no approved fiscal identity or provider.
  // Do NOT manufacture purchases, plan snapshots, provider success or zero
  // tax to satisfy table coverage. Both corresponding counts remain zero.
}
