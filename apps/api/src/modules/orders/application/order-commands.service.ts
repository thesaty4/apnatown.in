import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import { OrderDetailSchema, type OrderCancel, type OrderDetail, type OrderTransition } from '@apnatown/shared/orders';
import { SESSION_ACCESS, type SessionAccess } from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import { COMMAND_CONTEXT_FACTORY, HttpCommandContextFactory } from '../../../shared/idempotency/context';
import { RECEIPT_TTL_MS } from '../../../shared/idempotency/receipt-ttl';
import { COMMAND_UNIT_OF_WORK, type CommandUnitOfWork, type TxContext } from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import { ApprovedSellerAccess } from '../../businesses/application/approved-seller-access';
import { ORDER_WRITES, type OrderWriteRepository, type StoredOrder } from '../domain/order';
import type { OrderCommandRequest } from './order-access';
import { OrderDetailComposer } from './order-detail-composer';
import { OrderLifecycle } from './order-lifecycle';
import type { Viewer } from './order-view';

type Authorized = { order: StoredOrder; viewer: Viewer; actorKind: 'customer' | 'business' };

/**
 * Owner progression (accept/start_preparing/mark_ready) and cancel/reject
 * commands: Idempotency-Key + expected order version; ownership and live
 * approval are rechecked in the transaction and on replay (BR-04/BR-06).
 */
@Injectable()
export class OrderCommandsService {
  constructor(
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY) private readonly contexts: HttpCommandContextFactory,
    @Inject(ORDER_WRITES) private readonly writes: OrderWriteRepository,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly sellers: ApprovedSellerAccess,
    private readonly lifecycle: OrderLifecycle,
    private readonly composer: OrderDetailComposer,
  ) {}

  transition(request: OrderCommandRequest, orderId: string, input: OrderTransition): Promise<OrderDetail> {
    return this.run(request, orderId, 'transitions', input, async (tx) => {
      const { order } = await this.authorize(tx, request, orderId, 'business');
      return this.lifecycle.apply(tx, this.input(request, order, input.event, 'business', input.expectedVersion, null));
    }, 'business');
  }

  cancel(request: OrderCommandRequest, orderId: string, input: OrderCancel): Promise<OrderDetail> {
    const actor = input.event === 'cancel' ? 'customer' : 'business';
    return this.run(request, orderId, 'cancel', input, async (tx) => {
      const { order } = await this.authorize(tx, request, orderId, actor);
      return this.lifecycle.apply(tx, this.input(request, order, input.event, actor, input.expectedVersion, input.reasonKey));
    }, actor);
  }

  private input(
    request: OrderCommandRequest,
    order: StoredOrder,
    event: OrderTransition['event'] | OrderCancel['event'],
    kind: 'customer' | 'business',
    expectedVersion: number,
    reasonKey: string | null,
  ) {
    return {
      order,
      event,
      actor: { kind, userId: request.actorId },
      expectedVersion,
      reasonKey,
      correlationId: request.correlationId,
      at: this.clock.now(),
    };
  }

  /** Foreign/missing orders are ORDER_NOT_FOUND (no existence oracle). */
  private async authorize(
    tx: TxContext,
    request: OrderCommandRequest,
    orderId: string,
    actor: 'customer' | 'business',
  ): Promise<Authorized> {
    const principal = await this.sessions.requirePrincipal(tx, request.session);
    if (principal.userId !== request.actorId) throw new DomainError('SESSION_EXPIRED');
    const order = await this.writes.lock(tx, orderId);
    if (!order) throw new DomainError('ORDER_NOT_FOUND');
    if (actor === 'customer') {
      if (order.customerUserId !== principal.userId) throw new DomainError('ORDER_NOT_FOUND');
      return { order, viewer: 'customer', actorKind: actor };
    }
    if (!(await this.sellers.forBusiness(tx, request, order.businessId, true)))
      throw new DomainError('ORDER_NOT_FOUND');
    return { order, viewer: 'business', actorKind: actor };
  }

  private run(
    request: OrderCommandRequest,
    orderId: string,
    action: 'transitions' | 'cancel',
    input: OrderTransition | OrderCancel,
    work: (tx: TxContext) => Promise<StoredOrder>,
    viewer: 'customer' | 'business',
  ): Promise<OrderDetail> {
    const command = this.contexts.create(
      { name: `orders.${action}`, method: 'POST', scope: 'principal', successStatus: 200 },
      {
        actorId: request.actorId,
        correlationId: request.correlationId,
        resource: `/orders/${orderId}/${action}`,
        business: null,
        expiresAt: new Date(this.clock.now().getTime() + RECEIPT_TTL_MS),
      },
      { key: request.key, payload: input as JsonValue },
    );
    return this.commands.run(
      command,
      async (tx) => (await this.composer.compose(tx, await work(tx), viewer)) as OrderDetail & JsonValue,
      {
        store: (result) => ({ orderId: result.id, version: result.version }),
        // Replay reauthorizes and returns the current view, never a stale copy.
        replay: async (tx) => {
          const { order } = await this.authorize(tx, request, orderId, viewer);
          return OrderDetailSchema.parse(await this.composer.compose(tx, order, viewer)) as OrderDetail & JsonValue;
        },
      },
    );
  }
}
