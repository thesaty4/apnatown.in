import { FIXTURE_CLOCK } from './seed-fixtures.mjs';
import { seedReference } from './seed-context.mjs';

export async function seedCommerceReporting(client, context, counts) {
  // The migration normally owns this baseline; never move it backwards to
  // make a chart look complete. Missing coverage with existing observations
  // is unknown history, not permission to invent a baseline.
  const coverage = await client.query(
    `INSERT INTO business_reporting_coverage (metric, started_at)
     SELECT 'profile_views', $1::timestamptz
     WHERE NOT EXISTS (SELECT 1 FROM business_daily_views)
     ON CONFLICT DO NOTHING`,
    [FIXTURE_CLOCK],
  );
  counts.business_reporting_coverage += coverage.rowCount;
  for (const [index, business] of context.fixtures.businesses.entries()) {
    const businessId = seedReference(context.businesses, business.key);
    // A bounded synthetic 30-day dataset, not imported visitor identities or
    // invented conversion/payment attribution. Dates are Nov 1–30, 2026 IST.
    // Exclude pre-coverage and future days at execution; old baselines and
    // already observed/operator-edited daily buckets are left untouched.
    const views = await client.query(
      `INSERT INTO business_daily_views (business_id, ist_date, views)
       SELECT b.id, ($2::timestamptz AT TIME ZONE 'Asia/Kolkata')::date + d.day,
         (10 + (($3::int * 7 + d.day * 3) % 41))::bigint
       FROM businesses_public_context b
       CROSS JOIN generate_series(0, 29) AS d(day)
       JOIN business_reporting_coverage coverage ON coverage.metric = 'profile_views'
       WHERE b.id = $1::uuid
         AND ($2::timestamptz AT TIME ZONE 'Asia/Kolkata')::date + d.day
           >= (coverage.started_at AT TIME ZONE 'Asia/Kolkata')::date
         AND ($2::timestamptz AT TIME ZONE 'Asia/Kolkata')::date + d.day
           <= (transaction_timestamp() AT TIME ZONE 'Asia/Kolkata')::date
       ON CONFLICT DO NOTHING`,
      [businessId, FIXTURE_CLOCK, index],
    );
    counts.business_daily_views += views.rowCount;
  }
  // business_view_dedup is runtime session telemetry, intentionally absent.
}
