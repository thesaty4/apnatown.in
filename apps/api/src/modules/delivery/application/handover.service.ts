import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  HandoverResultSchema,
  SelfDispatchResultSchema,
  type DeliveryCodeKind,
  type HandoverResult,
  type PickupVerify,
  type SelfComplete,
  type SelfDispatch,
  type SelfDispatchResult,
} from '@apnatown/shared/delivery';
import type { OrderMode, OrderStatus } from '@apnatown/shared/orders';
import { DomainError } from '../../../shared/errors/errors';
import { COMMAND_UNIT_OF_WORK, type CommandUnitOfWork, type TxContext } from '../../../shared/persistence/ports';
import type { FulfilmentEvent, FulfilmentOrder } from '../../orders/application/order-ports';
import { receipt } from '../../catalog/application/catalog-mappers';
import { DeliveryCodesService } from './delivery-codes.service';
import { HandoverSupport, type HandoverCommand } from './handover-support';
import { HandoverVerifier, type Rejected } from './handover-verifier';

interface CompletionSpec {
  readonly name: 'self_complete' | 'pickup_verify';
  readonly mode: OrderMode;
  readonly from: OrderStatus;
  readonly kind: DeliveryCodeKind;
  readonly event: FulfilmentEvent;
  readonly outboxType: string;
}

const SELF_COMPLETE: CompletionSpec = {
  name: 'self_complete', mode: 'delivery', from: 'out_for_delivery', kind: 'delivery_otp',
  event: 'delivery.self_delivered', outboxType: 'delivery.self_delivered',
};
const PICKUP_VERIFY: CompletionSpec = {
  name: 'pickup_verify', mode: 'pickup', from: 'ready', kind: 'pickup_code',
  event: 'delivery.pickup_completed', outboxType: 'delivery.pickup_completed',
};

type Outcome = { result: HandoverResult } | Rejected;
const REJECTED_STATUS = { DELIVERY_CODE_INVALID: 422, DELIVERY_CODE_LOCKED: 423 } as const;

/** Mode/method/status/version guard shared by the jobless handover commands. */
export function guard(order: FulfilmentOrder, spec: { mode: OrderMode; from: OrderStatus; self: boolean }, expectedVersion: number) {
  if (order.mode !== spec.mode) throw new DomainError('DELIVERY_INVALID_TRANSITION');
  if (spec.self && order.deliveryMethod !== 'self') throw new DomainError('DELIVERY_INVALID_TRANSITION');
  if (order.status !== spec.from) throw new DomainError('DELIVERY_INVALID_TRANSITION');
  if (order.version !== expectedVersion) throw new DomainError('DELIVERY_VERSION_CONFLICT');
}

/**
 * Jobless handover for self-delivery and pickup (delivery BE rules 6/8/9;
 * F-VD-008, F-PV-005): approved owner only, versioned and idempotent.
 * A wrong code is a committed typed rejection (attempt bookkeeping survives,
 * same-key retry does not count twice); success consumes the code, moves
 * the order and collects outstanding cash in one UoW.
 */
@Injectable()
export class HandoverService {
  constructor(
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    private readonly support: HandoverSupport,
    private readonly codes: DeliveryCodesService,
    private readonly verifier: HandoverVerifier,
  ) {}

  selfDispatch(request: HandoverCommand, orderId: string, input: SelfDispatch): Promise<SelfDispatchResult> {
    const resource = `/delivery/orders/${orderId}/self-dispatch`;
    return this.commands.run(
      this.support.command(request, 'delivery.self_dispatch', resource, input),
      async (tx) => {
        const order = await this.support.ownedOrder(tx, request, orderId);
        guard(order, { mode: 'delivery', from: 'ready', self: true }, input.expectedOrderVersion);
        const at = this.support.clock.now();
        const after = await this.support.orders.apply(tx, {
          eventName: 'delivery.self_dispatched', orderId, expectedOrderVersion: input.expectedOrderVersion,
          actorUserId: request.actorId, handoverId: null, correlationId: request.correlationId, at,
        });
        await this.support.publish(tx, 'delivery.self_dispatched', after, { actorUserId: request.actorId }, request.correlationId);
        return SelfDispatchResultSchema.parse({
          orderId, orderStatus: after.status, orderVersion: after.version, financialVersion: after.financialVersion,
          handover: await this.codes.handoverState(tx, orderId, at), dispatchedAt: at.toISOString(),
        }) as SelfDispatchResult & JsonValue;
      },
      {
        ...receipt(SelfDispatchResultSchema),
        replay: async (tx, stored) => {
          await this.support.ownedOrder(tx, request, orderId);
          return SelfDispatchResultSchema.parse(stored) as SelfDispatchResult & JsonValue;
        },
      },
    );
  }

  selfComplete(request: HandoverCommand, orderId: string, input: SelfComplete): Promise<HandoverResult> {
    return this.complete(request, orderId, input, SELF_COMPLETE, `/delivery/orders/${orderId}/self-complete`);
  }

  pickupVerify(request: HandoverCommand, input: PickupVerify): Promise<HandoverResult> {
    const { orderId, ...rest } = input;
    return this.complete(request, orderId, rest, PICKUP_VERIFY, '/delivery/pickup-codes/verify');
  }

  private async complete(
    request: HandoverCommand,
    orderId: string,
    input: SelfComplete,
    spec: CompletionSpec,
    resource: string,
  ): Promise<HandoverResult> {
    const stored = await this.commands.run<JsonValue>(
      this.support.command(request, `delivery.${spec.name}`, resource, { orderId, ...input } as JsonValue),
      async (tx) => (await this.attempt(tx, request, orderId, input, spec)) as JsonValue,
      {
        store: (result) => result,
        replay: async (tx, previous) => {
          await this.support.ownedOrder(tx, request, orderId);
          return previous;
        },
        httpStatus: (result) => {
          const rejected = (result as Outcome as Partial<Rejected>).rejected;
          return rejected ? REJECTED_STATUS[rejected] : 200;
        },
      },
    );
    const outcome = stored as Outcome;
    if ('rejected' in outcome) throw new DomainError(outcome.rejected);
    return HandoverResultSchema.parse(outcome.result);
  }

  private async attempt(
    tx: TxContext,
    request: HandoverCommand,
    orderId: string,
    input: SelfComplete,
    spec: CompletionSpec,
  ): Promise<Outcome> {
    const order = await this.support.ownedOrder(tx, request, orderId);
    guard(order, { mode: spec.mode, from: spec.from, self: spec.mode === 'delivery' }, input.expectedOrderVersion);
    if (input.expectedFinancialVersion !== undefined && input.expectedFinancialVersion !== order.financialVersion)
      throw new DomainError('DELIVERY_VERSION_CONFLICT');
    const at = this.support.clock.now();
    const checked = await this.verifier.check(tx, { order, kind: spec.kind, input, at, correlationId: request.correlationId });
    if ('rejected' in checked) return checked;
    const result = await this.verifier.commit(tx, {
      order, code: checked.code, event: spec.event, actorUserId: request.actorId,
      outstandingPaise: checked.outstandingPaise, correlationId: request.correlationId, at,
    });
    await this.support.publish(
      tx, spec.outboxType, { ...order, version: result.orderVersion },
      { actorUserId: request.actorId, handoverId: result.handoverId }, request.correlationId,
    );
    return { result };
  }
}
