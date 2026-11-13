import { Inject, Injectable } from '@nestjs/common';
import {
  BusinessOrderCountsSchema,
  BusinessOrderPageSchema,
  CustomerOrderPageSchema,
  type BusinessOrderCounts,
  type BusinessOrderPage,
  type BusinessOrdersQuery,
  type CustomerOrderPage,
  type CustomerOrdersQuery,
  type OrderDetail,
  type OrderStatus,
} from '@apnatown/shared/orders';
import { SESSION_ACCESS, type SessionAccess } from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import { UNIT_OF_WORK, type TxContext, type UnitOfWork } from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import { ApprovedSellerAccess } from '../../businesses/application/approved-seller-access';
import { PAYMENT_ORDER, type PaymentOrderPort } from '../../payments/application/payment-order-port';
import { USER_IDENTITY, type UserIdentityPort } from '../../users/application/identity-port';
import { ORDER_READS, type ListOwner, type OrderReadRepository } from '../domain/order';
import { BUSINESS_TAB_STATUSES, CUSTOMER_GROUP_STATUSES } from '../domain/order-state-machine';
import type { OrderRequest } from './order-access';
import { OrderDetailComposer } from './order-detail-composer';
import { OrderPager, card } from './order-pager';
import { firstName } from './order-view';

const sum = (counts: Map<OrderStatus, number>, statuses: readonly OrderStatus[]) =>
  statuses.reduce((total, status) => total + (counts.get(status) ?? 0), 0);

/** Customer history and approved-owner queues (F-OR-001, F-VD-008, F-PV-005). */
@Injectable()
export class OrderReadService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(ORDER_READS) private readonly reads: OrderReadRepository,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(PAYMENT_ORDER) private readonly payments: PaymentOrderPort,
    @Inject(USER_IDENTITY) private readonly identity: UserIdentityPort,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly sellers: ApprovedSellerAccess,
    private readonly composer: OrderDetailComposer,
    private readonly pager: OrderPager,
  ) {}

  customerPage(request: OrderRequest, query: CustomerOrdersQuery): Promise<CustomerOrderPage> {
    return this.uow.run(async (tx) => {
      const userId = await this.principal(tx, request);
      const owner: ListOwner = { kind: 'customer', userId };
      const page = await this.pager.page(tx, {
        owner,
        statuses: CUSTOMER_GROUP_STATUSES[query.group],
        binding: { operation: 'orders.customer.list', filters: { group: query.group }, scope: { userId } },
        query,
      });
      const counts = await this.reads.counts(tx, owner);
      return CustomerOrderPageSchema.parse({
        items: page.rows.map((row) => ({
          ...card(row),
          business: { id: row.businessId, nameEn: row.businessNameEn, nameHi: row.businessNameHi },
        })),
        counts: {
          active: sum(counts, CUSTOMER_GROUP_STATUSES.active),
          completed: sum(counts, CUSTOMER_GROUP_STATUSES.completed),
          cancelled: sum(counts, CUSTOMER_GROUP_STATUSES.cancelled),
        },
        nextCursor: page.nextCursor,
        asOf: this.clock.now().toISOString(),
      });
    });
  }

  businessPage(request: OrderRequest, query: BusinessOrdersQuery): Promise<BusinessOrderPage> {
    return this.uow.run(async (tx) => {
      const business = await this.sellers.resolve(tx, request);
      const owner: ListOwner = { kind: 'business', businessId: business.id };
      const page = await this.pager.page(tx, {
        owner,
        statuses: BUSINESS_TAB_STATUSES[query.tab],
        binding: { operation: 'orders.business.list', filters: { tab: query.tab }, scope: { businessId: business.id } },
        query,
      });
      const ids = page.rows.map((row) => row.id);
      const payments = await this.payments.listing(tx, ids);
      const names = new Map(
        (await this.identity.describe(tx, [...new Set(page.rows.map((r) => r.customerUserId))])).map((u) => [
          u.userId,
          firstName(u.displayName),
        ]),
      );
      return BusinessOrderPageSchema.parse({
        items: page.rows.map((row) => {
          const payment = payments.get(row.id);
          if (!payment) throw new Error('ORDER_PAYMENT_MISSING');
          return {
            ...card(row),
            version: row.version,
            customerFirstName: names.get(row.customerUserId) ?? null,
            deliveryMethod: row.deliveryMethod,
            paymentMethod: payment.method,
            paymentStatus: payment.status,
          };
        }),
        counts: await this.countsFor(tx, owner),
        nextCursor: page.nextCursor,
        asOf: this.clock.now().toISOString(),
      });
    });
  }

  businessCounts(request: OrderRequest): Promise<BusinessOrderCounts> {
    return this.uow.run(async (tx) => {
      const business = await this.sellers.resolve(tx, request);
      return this.countsFor(tx, { kind: 'business', businessId: business.id });
    });
  }

  /**
   * Customer view for the order's customer; business view for its approved
   * owner (preferred when X-Business-Kind is sent). Anything else is 404.
   */
  detail(request: OrderRequest, orderId: string): Promise<OrderDetail> {
    return this.uow.run(async (tx) => {
      const userId = await this.principal(tx, request);
      const order = await this.reads.find(tx, orderId);
      if (!order) throw new DomainError('ORDER_NOT_FOUND');
      const customer = order.customerUserId === userId;
      if (customer && !request.businessKind) return this.composer.compose(tx, order, 'customer');
      if (await this.sellers.forBusiness(tx, request, order.businessId))
        return this.composer.compose(tx, order, 'business');
      if (customer) return this.composer.compose(tx, order, 'customer');
      throw new DomainError('ORDER_NOT_FOUND');
    });
  }

  private async countsFor(tx: TxContext, owner: ListOwner): Promise<BusinessOrderCounts> {
    const counts = await this.reads.counts(tx, owner);
    return BusinessOrderCountsSchema.parse({
      asOf: this.clock.now().toISOString(),
      new: sum(counts, BUSINESS_TAB_STATUSES.new),
      inProgress: sum(counts, BUSINESS_TAB_STATUSES.in_progress),
      readyOut: sum(counts, BUSINESS_TAB_STATUSES.ready_out),
      completed: sum(counts, BUSINESS_TAB_STATUSES.completed),
      cancelled: sum(counts, BUSINESS_TAB_STATUSES.cancelled),
    });
  }

  private async principal(tx: TxContext, request: OrderRequest): Promise<string> {
    const principal = await this.sessions.requirePrincipal(tx, request.session);
    if (principal.userId !== request.actorId) throw new DomainError('SESSION_EXPIRED');
    return principal.userId;
  }
}
