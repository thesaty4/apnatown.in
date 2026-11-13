import { FIXTURE_CLOCK } from './seed-fixtures.mjs';

// LOCAL/TEST only: docs/design-context/10-sample-data.json `cfg.plans` and
// `cfg.promos` (rupees, % commission) -> Settings `plans` / `promotion_fees`
// (paise, bps) so Earnings & plan can show configured options. Insert-only:
// a Super Admin value is never overwritten. Hindi names are transliterations.
// TODO(verify): production plan prices/commission and promotion fees need approval.
const PLAN_HI = Object.freeze({ basic: 'बेसिक', growth: 'ग्रोथ', pro: 'प्रो' });
const PROMOS = Object.freeze({
  pr1: { code: 'featured_listing', kind: 'featured_business', nameHi: 'फ़ीचर्ड लिस्टिंग (7 दिन)' },
  pr2: { code: 'homepage_banner', kind: 'homepage_banner', nameHi: 'होमपेज बैनर (7 दिन)' },
});

async function insertSetting(client, key, value) {
  const { rowCount } = await client.query(
    `INSERT INTO settings (key, value, version, updated_by, updated_at)
     VALUES ($1, $2::jsonb, 1, NULL, $3::timestamptz) ON CONFLICT (key) DO NOTHING`,
    [key, JSON.stringify(value), FIXTURE_CLOCK],
  );
  return rowCount;
}

export async function seedEarningsSettings(client, context) {
  const { plans = [], promos = [] } = context.sample.cfg ?? {};
  const planValue = context.helpers.settingSchemas.plans.parse(
    plans
      .filter((plan) => PLAN_HI[plan.id])
      .map((plan) => ({
        code: plan.id,
        nameEn: plan.n,
        nameHi: PLAN_HI[plan.id],
        pricePaise: plan.price * 100,
        commissionBps: plan.comm * 100,
        enabled: true,
        premium: plan.price > 0,
        billingPeriodMonths: 1,
      })),
  );
  const promoValue = context.helpers.settingSchemas.promotion_fees.parse(
    promos
      .filter((promo) => PROMOS[promo.id])
      .map((promo) => ({
        code: PROMOS[promo.id].code,
        nameEn: promo.n,
        nameHi: PROMOS[promo.id].nameHi,
        pricePaise: promo.price * 100,
        enabled: true,
        kind: PROMOS[promo.id].kind,
        durationDays: 7,
      })),
  );
  return {
    settings_plans: planValue.length ? await insertSetting(client, 'plans', planValue) : 0,
    settings_promotion_fees: promoValue.length ? await insertSetting(client, 'promotion_fees', promoValue) : 0,
  };
}
