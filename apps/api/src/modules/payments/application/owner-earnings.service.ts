import { Inject, Injectable } from '@nestjs/common';
import {
  BillingOverviewSchema,
  EarningsSchema,
  type BillingOverview,
  type Earnings,
} from '@apnatown/shared/earnings';
import { UNIT_OF_WORK, type TxContext, type UnitOfWork } from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import {
  ApprovedSellerAccess,
  type SellerRequest,
} from '../../businesses/application/approved-seller-access';
import { SETTINGS_READ, type SettingsReadPort } from '../../settings/application/settings-ports';
import { EARNINGS_READ, type EarningsReadPort } from './earnings-ports';

const IST_OFFSET_MS = 330 * 60 * 1000;
const MONTHS = 6;

/** Last `count` IST months (YYYY-MM), oldest first. */
function istMonths(now: Date, count: number): string[] {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth() - (count - 1 - index), 1));
    return date.toISOString().slice(0, 7);
  });
}

/**
 * S-VEND-16 Earnings & plan (read-only). Commission is an estimate at the
 * current plan's rate (else the platform default); no payout schedule,
 * invoices or purchases exist yet and are reported as unavailable.
 */
@Injectable()
export class OwnerEarningsService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(EARNINGS_READ) private readonly earnings: EarningsReadPort,
    @Inject(SETTINGS_READ) private readonly settings: SettingsReadPort,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly sellers: ApprovedSellerAccess,
  ) {}

  summary(request: SellerRequest): Promise<Earnings> {
    return this.uow.run(async (tx) => {
      const business = await this.sellers.resolve(tx, request);
      const now = this.clock.now();
      const months = istMonths(now, MONTHS);
      const sales = await this.earnings.monthlySales(tx, {
        businessId: business.id,
        fromIstMonth: months[0]!,
      });
      const series = months.map((month) => ({
        month,
        grossPaise: sales.get(month)?.grossPaise ?? 0,
        orders: sales.get(month)?.orders ?? 0,
      }));
      const current = series.at(-1)!;
      const bps = await this.commissionBps(tx, business.id, now);
      const commissionPaise = bps === null ? null : Math.round((current.grossPaise * bps) / 10_000);
      return EarningsSchema.parse({
        month: current.month,
        grossPaise: current.grossPaise,
        orders: current.orders,
        commissionBps: bps,
        commissionPaise,
        netPaise: commissionPaise === null ? null : current.grossPaise - commissionPaise,
        months: series,
        asOf: now.toISOString(),
        unavailable: [
          'payout_schedule',
          'invoices',
          ...(bps === null ? (['commission_policy'] as const) : []),
        ],
      });
    });
  }

  billing(request: SellerRequest): Promise<BillingOverview> {
    return this.uow.run(async (tx) => {
      const business = await this.sellers.resolve(tx, request);
      const now = this.clock.now();
      const [plans, promotions, subscription] = await Promise.all([
        this.settings.get('plans', tx),
        this.settings.get('promotion_fees', tx),
        this.earnings.activeSubscription(tx, { businessId: business.id, at: now }),
      ]);
      const enabled = plans?.value.filter((plan) => plan.enabled) ?? null;
      const currentCode = subscription?.planKey ?? enabled?.find((plan) => !plan.premium)?.code ?? null;
      return BillingOverviewSchema.parse({
        plans:
          enabled?.map(({ enabled: _enabled, billingPeriodMonths: _period, ...plan }) => ({
            ...plan,
            current: plan.code === currentCode,
          })) ?? null,
        currentEndsAt: subscription?.endsAt ?? null,
        promotions:
          promotions?.value
            .filter((fee) => fee.enabled)
            .map(({ code, nameEn, nameHi, pricePaise, durationDays }) => ({
              code,
              nameEn,
              nameHi,
              pricePaise,
              durationDays,
            })) ?? null,
        purchaseAvailable: false,
      });
    });
  }

  /** Current plan rate (subscription, else the free plan), else platform default. */
  private async commissionBps(tx: TxContext, businessId: string, now: Date): Promise<number | null> {
    const [plans, commission, subscription] = await Promise.all([
      this.settings.get('plans', tx),
      this.settings.get('commission', tx),
      this.earnings.activeSubscription(tx, { businessId, at: now }),
    ]);
    const enabled = plans?.value.filter((plan) => plan.enabled) ?? [];
    const plan =
      enabled.find((item) => item.code === subscription?.planKey) ??
      enabled.find((item) => !item.premium);
    return plan?.commissionBps ?? commission?.value.defaultBps ?? null;
  }
}
