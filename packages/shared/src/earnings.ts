import { z } from 'zod';
import { CountSchema, PaiseSchema, TimestampSchema } from './wire.js';

// Vendor Earnings & plan (S-VEND-16, F-VD-017; specs/payments/be/payments.md).
// Read-only: sales come from fulfilled orders whose payment is paid/collected;
// commission is an estimate at the current plan/default rate. No settlement
// ledger, payout schedule, purchases or invoices exist yet, so those are
// explicitly unavailable — never fabricated.

const MonthSchema = z.string().regex(/^\d{4}-\d{2}$/);

export const EarningsSchema = z.strictObject({
  /** Current IST month. */
  month: MonthSchema,
  grossPaise: PaiseSchema,
  orders: CountSchema,
  /** null when no commission policy/plan rate is configured. */
  commissionBps: z.number().int().min(0).max(10000).nullable(),
  commissionPaise: PaiseSchema.nullable(),
  netPaise: PaiseSchema.nullable(),
  /** Oldest first, six IST months ending with the current one. */
  months: z
    .array(z.strictObject({ month: MonthSchema, grossPaise: PaiseSchema, orders: CountSchema }))
    .length(6),
  asOf: TimestampSchema,
  unavailable: z.array(z.enum(['payout_schedule', 'invoices', 'commission_policy'])),
});
export type Earnings = z.infer<typeof EarningsSchema>;

export const PlanOptionSchema = z.strictObject({
  code: z.string(),
  nameEn: z.string(),
  nameHi: z.string(),
  pricePaise: PaiseSchema,
  commissionBps: z.number().int().min(0).max(10000),
  premium: z.boolean(),
  current: z.boolean(),
});
export type PlanOption = z.infer<typeof PlanOptionSchema>;

export const PromotionOptionSchema = z.strictObject({
  code: z.string(),
  nameEn: z.string(),
  nameHi: z.string(),
  pricePaise: PaiseSchema,
  durationDays: z.number().int().positive(),
});
export type PromotionOption = z.infer<typeof PromotionOptionSchema>;

export const BillingOverviewSchema = z.strictObject({
  /** null when plans are not configured. */
  plans: z.array(PlanOptionSchema).nullable(),
  /** Paid plan expiry when a Premium subscription is active. */
  currentEndsAt: TimestampSchema.nullable(),
  promotions: z.array(PromotionOptionSchema).nullable(),
  /** Purchases need online payments + reviewed billing; not available yet. */
  purchaseAvailable: z.literal(false),
});
export type BillingOverview = z.infer<typeof BillingOverviewSchema>;
