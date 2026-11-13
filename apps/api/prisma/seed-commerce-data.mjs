import { seedCommerceBilling } from './seed-commerce-billing.mjs';
import { seedCommerceProducts } from './seed-commerce-products.mjs';
import { seedCommerceOffers } from './seed-commerce-offers.mjs';
import { seedCommerceCart } from './seed-commerce-cart.mjs';
import { seedCommerceReporting } from './seed-commerce-reporting.mjs';
import { loadCommerceSchemas } from './seed-commerce-support.mjs';

/**
 * LOCAL/TEST only. The parent owns target verification, identity resolution,
 * locks and the transaction. No connection, commit, migration, provider call,
 * outbox event or settings write belongs here.
 *
 * Counts are actual INSERT rowCounts, including explicit zeroes for financial
 * tables we cannot populate honestly. Basic needs no subscription/payment row.
 */
export async function seedCommerceData(client, context) {
  const schemas = loadCommerceSchemas();
  const counts = {
    product_variants: 0,
    product_category_pills: 0,
    business_billing_profiles: 0,
    business_subscription_versions: 0,
    business_subscriptions: 0,
    billing_purchases: 0,
    offers: 0,
    offer_targets: 0,
    promotion_placements: 0,
    carts: 0,
    cart_lines: 0,
    business_daily_views: 0,
    business_reporting_coverage: 0,
  };
  await seedCommerceBilling(client, context, schemas, counts);
  await seedCommerceProducts(client, context, schemas, counts);
  await seedCommerceOffers(client, context, counts);
  await seedCommerceCart(client, context, schemas, counts);
  await seedCommerceReporting(client, context, counts);
  return counts;
}
