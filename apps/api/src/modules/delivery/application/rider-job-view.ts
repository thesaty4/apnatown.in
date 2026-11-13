import { Inject, Injectable } from '@nestjs/common';
import {
  RiderJobSchema,
  RiderOfferSchema,
  type RiderHistory,
  type RiderJob,
  type RiderOffer,
} from '@apnatown/shared/delivery';
import type { TxContext } from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import { GEO_SCOPE, type GeoScopePort } from '../../geo/application/geo-scope.port';
import {
  ORDERS_FULFILMENT,
  type DispatchOrderSummary,
  type OrdersFulfilmentPort,
} from '../../orders/application/order-ports';
import { PAYMENT_ORDER, type PaymentOrderPort } from '../../payments/application/payment-order-port';
import {
  DELIVERY_JOB_REPOSITORY,
  riderJobActions,
  type DeliveryJobRepository,
  type StoredJob,
  type StoredOffer,
} from '../domain/delivery-job';
import { DeliveryCodesService } from './delivery-codes.service';

const label = (value: string | null | undefined) => (value ?? '').slice(0, 120);

/**
 * Rider-facing DTO composition (RiderOfferDTO / RiderJobDTO / history rows).
 * Items and payable come from Orders/Payments at read time, never stale job
 * copies. The drop address is shown only on the assigned active job; offers
 * and history carry area labels only. No code, phone or customer surname.
 */
@Injectable()
export class RiderJobView {
  constructor(
    @Inject(DELIVERY_JOB_REPOSITORY) private readonly jobs: DeliveryJobRepository,
    @Inject(ORDERS_FULFILMENT) private readonly orders: OrdersFulfilmentPort,
    @Inject(PAYMENT_ORDER) private readonly payments: PaymentOrderPort,
    @Inject(GEO_SCOPE) private readonly geo: GeoScopePort,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly codes: DeliveryCodesService,
  ) {}

  async offer(tx: TxContext, offer: StoredOffer): Promise<RiderOffer | null> {
    const job = await this.jobs.find(tx, offer.jobId);
    const summary = job ? (await this.orders.dispatchSummaries(tx, [job.orderId])).get(job.orderId) : undefined;
    if (!job || !summary) return null;
    const [dropArea] = await this.areaNames(tx, [summary]);
    return RiderOfferSchema.parse({
      offerId: offer.id,
      version: offer.version,
      jobId: job.id,
      pickup: { businessName: label(summary.businessName), area: label(summary.businessAreaName) },
      dropArea: dropArea ?? '',
      distanceM: job.distanceM,
      itemCount: summary.itemCount,
      estimate: job.estimate,
      expiresAt: offer.expiresAt.toISOString(),
      serverTime: this.clock.now().toISOString(),
    });
  }

  /** Assigned active job, including the drop address (rule 11). */
  async job(tx: TxContext, job: StoredJob): Promise<RiderJob> {
    const view = await this.orders.dispatchView(tx, job.orderId);
    const payment = await this.payments.summary(tx, job.orderId);
    if (!view?.address || !payment) throw new Error('DELIVERY_ORDER_MISSING');
    const handover = await this.codes.handoverState(tx, job.orderId, this.clock.now());
    const address = view.address.landmark
      ? `${view.address.addressText} (${view.address.landmark})`
      : view.address.addressText;
    return RiderJobSchema.parse({
      jobId: job.id,
      orderId: job.orderId,
      orderNumber: view.orderNumber,
      version: job.version,
      orderVersion: view.version,
      financialVersion: view.financialVersion,
      status: job.status,
      allowedActions: riderJobActions(job.status),
      pickup: { businessName: label(view.businessName), area: label(view.businessAreaName) },
      drop: { firstName: label(view.customerFirstName), address: address.slice(0, 500), location: view.address.location },
      items: view.items.map((item) => ({
        orderItemId: item.id,
        name: label(item.nameEn),
        ...(item.variantLabel ? { variantLabel: label(item.variantLabel) } : {}),
        quantity: item.quantity,
        availability: item.availability === 'ordered' ? 'available' : 'unavailable',
      })),
      itemCount: view.itemCount,
      distanceM: job.distanceM,
      estimate: job.estimate,
      ...(job.earned ? { earned: job.earned } : {}),
      payment: {
        method: payment.settlementKind === 'cash' ? 'cod' : 'prepaid',
        currentPayablePaise: payment.currentPayablePaise,
        outstandingPaise: payment.outstandingPaise,
        status: payment.status,
      },
      handover: Object.fromEntries(Object.entries(handover).filter(([, value]) => value !== null)),
      // TODO(verify): masked-call provider is unresolved (G-16); never a raw phone.
      call: { available: false },
    });
  }

  /** Terminal history rows: persisted breakdown + area labels only. */
  async history(tx: TxContext, jobs: readonly StoredJob[]): Promise<RiderHistory[]> {
    const summaries = await this.orders.dispatchSummaries(tx, jobs.map((job) => job.orderId));
    const ordered = jobs.map((job) => summaries.get(job.orderId));
    const areas = await this.areaNames(tx, ordered);
    return jobs.flatMap((job, index) => {
      const summary = ordered[index];
      if (!summary || !['delivered', 'failed', 'cancelled'].includes(job.status)) return [];
      return [{
        jobId: job.id,
        orderId: job.orderId,
        orderNumber: summary.orderNumber,
        shopName: label(summary.businessName),
        dropArea: areas[index] ?? '',
        status: job.status as RiderHistory['status'],
        ...(job.failReason ? { reasonKey: job.failReason } : {}),
        distanceM: job.distanceM,
        timestamps: {
          acceptedAt: job.acceptedAt, deliveredAt: job.deliveredAt,
          failedAt: job.failedAt, cancelledAt: job.cancelledAt,
        },
        estimate: job.estimate,
        ...(job.earned ? { earned: job.earned } : {}),
      }];
    });
  }

  private async areaNames(tx: TxContext, summaries: readonly (DispatchOrderSummary | undefined)[]) {
    const ids = [...new Set(summaries.flatMap((s) => (s?.dropAreaId ? [s.dropAreaId] : [])))];
    const areas = ids.length ? await this.geo.describeAreas(ids, tx) : [];
    const names = new Map(areas.map((area) => [area.id, area.nameEn]));
    return summaries.map((s) => (s?.dropAreaId ? label(names.get(s.dropAreaId)) : ''));
  }
}
