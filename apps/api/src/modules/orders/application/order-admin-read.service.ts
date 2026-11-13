import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import {
  AdminOrderPageSchema,
  type AdminOrderPage,
  type AdminOrdersQuery,
  type OrderDetail,
  type OrderStatus,
} from '@apnatown/shared/orders';
import type { AdminReadContext } from '../../../shared/auth/ports';
import { ScopeRegistry } from '../../../shared/auth/scope-registry';
import { DomainError } from '../../../shared/errors/errors';
import { UNIT_OF_WORK, type UnitOfWork } from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import { assertReader, visibility } from '../../businesses/application/business-reviewer';
import { PAYMENT_ORDER, type PaymentOrderPort } from '../../payments/application/payment-order-port';
import { ORDER_READS, type OrderReadRepository } from '../domain/order';
import { ACTIVE_STATUSES, ORDER_STATUSES_ALL } from '../domain/order-state-machine';
import { OrderDetailComposer } from './order-detail-composer';
import { OrderPager } from './order-pager';

export const ORDER_SCOPE = 'orders.order';

/** Cases/refunds/failed deliveries are not implemented: those filters are empty. */
const FILTER_STATUSES: Record<AdminOrdersQuery['filter'], readonly OrderStatus[]> = {
  all: ORDER_STATUSES_ALL,
  active: ACTIVE_STATUSES,
  disputes: [],
  refunds: [],
  failed: [],
};

/**
 * Read-only scoped admin orders (F-AD-007, BR-12): `orders:view` plus the
 * caller's authoritative city/area scope over the order's purchase-time
 * business scope. No address or contact is exposed.
 */
@Injectable()
export class OrderAdminReadService implements OnModuleInit {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(ORDER_READS) private readonly reads: OrderReadRepository,
    @Inject(PAYMENT_ORDER) private readonly payments: PaymentOrderPort,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly registry: ScopeRegistry,
    private readonly pager: OrderPager,
    private readonly composer: OrderDetailComposer,
  ) {}

  onModuleInit(): void {
    this.registry.register(ORDER_SCOPE, async (id, tx) => {
      const scope = await (tx ? this.reads.scope(tx, id) : this.uow.run((t) => this.reads.scope(t, id)));
      return scope ? [scope] : null;
    });
  }

  list(ctx: AdminReadContext, query: AdminOrdersQuery): Promise<AdminOrderPage> {
    assertReader(ctx, 'orders');
    return this.uow.run(async (tx) => {
      const statuses = FILTER_STATUSES[query.filter];
      const page = statuses.length
        ? await this.pager.page(tx, {
            owner: { kind: 'admin', visibility: visibility(ctx) },
            statuses,
            binding: {
              operation: 'orders.admin.list',
              filters: { filter: query.filter },
              scope: { actor: ctx.actorUserId, revision: ctx.scopeRevision },
            },
            query,
          })
        : { rows: [], nextCursor: null };
      const payments = await this.payments.listing(tx, page.rows.map((row) => row.id));
      return AdminOrderPageSchema.parse({
        items: page.rows.map((row) => {
          const payment = payments.get(row.id);
          if (!payment) throw new Error('ORDER_PAYMENT_MISSING');
          return {
            id: row.id,
            orderNumber: row.orderNumber,
            business: { id: row.businessId, nameEn: row.businessNameEn, nameHi: row.businessNameHi },
            cityId: row.cityId,
            areaId: row.areaId,
            mode: row.mode,
            deliveryMethod: row.deliveryMethod,
            status: row.status,
            orderedTotalPaise: row.orderedTotalPaise,
            paymentMethod: payment.method,
            paymentStatus: payment.status,
            placedAt: row.placedAt.toISOString(),
          };
        }),
        nextCursor: page.nextCursor,
        asOf: this.clock.now().toISOString(),
      });
    });
  }

  /** The @Scoped guard already checked orders:view over this order's scope. */
  detail(ctx: AdminReadContext, orderId: string): Promise<OrderDetail> {
    assertReader(ctx, 'orders');
    return this.uow.run(async (tx) => {
      const order = await this.reads.find(tx, orderId);
      if (!order) throw new DomainError('ORDER_NOT_FOUND');
      return this.composer.compose(tx, order, 'admin');
    });
  }
}
