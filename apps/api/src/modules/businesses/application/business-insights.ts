import { Inject, Injectable } from '@nestjs/common';
import {
  ANALYTICS_UNAVAILABLE_METRICS,
  BusinessAnalyticsSchema,
  BusinessOverviewSchema,
  type BusinessAnalytics,
  type BusinessOverview,
} from '@apnatown/shared/businesses';
import type { TxContext } from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import {
  BUSINESS_REPOSITORY,
  capabilities,
  type BusinessRepository,
  type StoredBusiness,
} from '../domain/business';
import { istDate, summaryDto } from './business-mappers';

const PERIOD_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const SOURCE_UNAVAILABLE = {
  state: 'unavailable',
  code: 'SOURCE_UNAVAILABLE',
} as const;

/**
 * reporting-v1 owner summaries. Only profile views are owned here; every
 * section whose source module has not shipped (Products, Orders, Payments,
 * Services enquiries, Reviews, Engagement) is explicitly unavailable, never
 * an invented zero.
 */
@Injectable()
export class BusinessInsights {
  constructor(
    @Inject(BUSINESS_REPOSITORY)
    private readonly businesses: BusinessRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  overview(
    _tx: TxContext,
    business: StoredBusiness,
    sellerRole: boolean,
  ): Promise<BusinessOverview> {
    return Promise.resolve(BusinessOverviewSchema.parse({
      business: summaryDto(business),
      status: business.status,
      capabilities: capabilities(business, sellerRole),
      products: SOURCE_UNAVAILABLE,
      orders: SOURCE_UNAVAILABLE,
      earnings: SOURCE_UNAVAILABLE,
      // Shops have no enquiry inbox; providers wait for the Services module.
      enquiries:
        business.kind === 'shop'
          ? { state: 'unavailable', code: 'NOT_APPLICABLE' }
          : SOURCE_UNAVAILABLE,
      rating: SOURCE_UNAVAILABLE,
      followers: SOURCE_UNAVAILABLE,
      // Profile-view collection is not mounted yet, so a "ready" 30d count
      // would be an invented zero; stay explicitly unavailable until it is.
      analytics: SOURCE_UNAVAILABLE,
    }));
  }

  /**
   * 30 IST days ending today. Days before the observation coverage start
   * are null (unknown), not zero. The Services enquiry cohort is not yet
   * available, so enquiries/converted/conversion stay null and are listed.
   */
  async analytics(
    tx: TxContext,
    business: StoredBusiness,
  ): Promise<BusinessAnalytics> {
    const views = await this.views(tx, business.id);
    const unavailable: (typeof ANALYTICS_UNAVAILABLE_METRICS)[number][] = [];
    if (views.partial) unavailable.push('views_before_coverage');
    unavailable.push('enquiries', 'converted', 'conversionRate', 'statusCounts');
    return BusinessAnalyticsSchema.parse({
      period: '30d',
      views: views.total,
      enquiries: null,
      converted: null,
      conversionRate: null,
      daily: views.daily.map((day) => ({ ...day, enquiries: null })),
      statusCounts: null,
      asOf: views.asOf,
      coverageStartedAt: views.coverageStartedAt,
      unavailable,
      definitionVersion: 'reporting-v1',
    });
  }

  private async views(tx: TxContext, businessId: string) {
    const now = this.clock.now();
    const dates = Array.from({ length: PERIOD_DAYS }, (_, index) =>
      istDate(new Date(now.getTime() - (PERIOD_DAYS - 1 - index) * DAY_MS)),
    );
    const coverageStartedAt = await this.businesses.coverageStartedAt(tx);
    const coveredFrom = coverageStartedAt
      ? istDate(new Date(coverageStartedAt))
      : null;
    const counts = coveredFrom
      ? await this.businesses.dailyViews(tx, {
          businessId,
          fromIstDate: dates[0]!,
          toIstDate: dates.at(-1)!,
        })
      : new Map<string, number>();
    let total: number | null = null;
    const daily = dates.map((date) => {
      const covered = coveredFrom !== null && date >= coveredFrom;
      if (!covered) return { date, views: null };
      const views = counts.get(date) ?? 0;
      total = (total ?? 0) + views;
      return { date, views };
    });
    return {
      daily,
      total: total as number | null,
      partial: daily.some((day) => day.views === null),
      asOf: now.toISOString(),
      coverageStartedAt,
    };
  }
}
