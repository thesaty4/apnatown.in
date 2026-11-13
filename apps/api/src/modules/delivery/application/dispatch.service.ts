import { Inject, Injectable } from '@nestjs/common';
import { DELIVERY_EVENT_TYPES } from '@apnatown/shared/delivery';
import { DomainError } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';
import { ID_PROVIDER, type IdProvider } from '../../../shared/runtime/providers';
import {
  BUSINESS_CHECKOUT_READ,
  type BusinessCheckoutReadPort,
} from '../../businesses/application/business-checkout-read-port';
import { SETTINGS_READ, type SettingsReadPort } from '../../settings/application/settings-ports';
import { riderEarning, type StoredJob } from '../domain/delivery-job';
import type {
  DeliveryDispatchPort,
  DispatchContext,
  ReadyOrderFacts,
} from './delivery-dispatch-port';
import { DispatchAssignment } from './dispatch-assignment';
import { DispatchProjection } from './dispatch-projection';

export interface EarningPolicy {
  readonly basePaise: number;
  readonly perKmPaise: number;
  readonly settingsVersion: string;
}

/**
 * Job creation at platform `ready` (rule 1) and the order projection.
 * Exactly one job per order (unique order_id; replay returns the existing
 * row). Distance is the straight-line PostGIS metres from the shop's
 * location to the order's drop point; the estimate uses the current
 * `rider_earning` setting. Unknown distance/policy blocks, never a default.
 */
@Injectable()
export class DispatchService implements DeliveryDispatchPort {
  constructor(
    @Inject(SETTINGS_READ) private readonly settings: SettingsReadPort,
    @Inject(BUSINESS_CHECKOUT_READ) private readonly businesses: BusinessCheckoutReadPort,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    private readonly assignment: DispatchAssignment,
    private readonly projection: DispatchProjection,
  ) {}

  async ensureForReady(tx: TxContext, facts: ReadyOrderFacts, ctx: DispatchContext): Promise<void> {
    await this.ensure(tx, facts, ctx);
  }

  orderBlock(tx: TxContext, orderId: string, viewer: 'customer' | 'business' | 'admin', now: Date) {
    return this.projection.orderBlock(tx, orderId, viewer, now);
  }

  /** Existing (locked) job, or a new one with auto-assignment started. */
  async ensure(tx: TxContext, facts: ReadyOrderFacts, ctx: DispatchContext): Promise<StoredJob> {
    const existing = await this.assignment.jobs.byOrder(tx, facts.orderId, true);
    if (existing) return existing;
    const created = await this.create(tx, facts, ctx);
    return created.assignmentState === 'queued' ? this.assignment.offerNext(tx, created, ctx) : created;
  }

  /** Inserts the job (estimate snapshot + `delivery.job_created`), no offer yet. */
  async create(tx: TxContext, facts: ReadyOrderFacts, ctx: DispatchContext): Promise<StoredJob> {
    const policy = await this.earningPolicy(tx);
    const business = (await this.businesses.forCheckout(tx, [facts.businessId])).get(facts.businessId);
    if (!business?.location || !facts.dropPoint) throw new DomainError('DELIVERY_DISTANCE_UNAVAILABLE');
    const distanceM = await this.assignment.jobs.distanceM(tx, business.location, facts.dropPoint);
    const inserted = await this.assignment.jobs.insert(tx, {
      id: this.ids.uuidv7(),
      orderId: facts.orderId,
      cityId: facts.scope.cityId,
      areaId: facts.scope.areaId,
      pickup: business.location,
      drop: facts.dropPoint,
      distanceM,
      estimate: {
        basePaise: policy.basePaise,
        perKmPaise: policy.perKmPaise,
        totalPaise: riderEarning(policy.basePaise, policy.perKmPaise, distanceM).totalPaise,
        settingsVersion: policy.settingsVersion,
      },
      payableFinancialVersion: facts.financialVersion,
      at: ctx.at,
    });
    if (!inserted) return (await this.assignment.jobs.byOrder(tx, facts.orderId, true))!;
    await this.assignment.events.job(tx, DELIVERY_EVENT_TYPES.jobCreated, inserted, ctx, false);
    return inserted;
  }

  /** Current `rider_earning` setting (rule 12); unconfigured is a 503 gate. */
  async earningPolicy(tx: TxContext): Promise<EarningPolicy> {
    const setting = await this.settings.get('rider_earning', tx);
    if (!setting) throw new DomainError('DELIVERY_EARNING_POLICY_UNAVAILABLE');
    return {
      basePaise: setting.value.basePaise,
      perKmPaise: setting.value.perKmPaise,
      settingsVersion: `rider_earning@v${setting.version}`,
    };
  }
}
