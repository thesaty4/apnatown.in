import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import { DeliveryCodeSchema, type DeliveryCode, type DeliveryCodeReissue } from '@apnatown/shared/delivery';
import { z } from 'zod';
import { DomainError } from '../../../shared/errors/errors';
import {
  COMMAND_UNIT_OF_WORK,
  UNIT_OF_WORK,
  type CommandUnitOfWork,
  type TxContext,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import { REALTIME_SIGNAL, type RealtimeSignal } from '../../../shared/realtime/ports';
import type { FulfilmentOrder } from '../../orders/application/order-ports';
import { codeState, type StoredDeliveryCode } from '../domain/delivery-code';
import { DeliveryCodesService } from './delivery-codes.service';
import { HandoverSupport, type HandoverCommand } from './handover-support';

const ReissueReceiptSchema = z.strictObject({ orderId: z.string(), codeVersion: z.number().int().min(1) });

/** Order states in which the customer's code is the live handover proof. */
const usable = (order: FulfilmentOrder) =>
  (order.mode === 'pickup' && order.status === 'ready') ||
  (order.mode === 'delivery' && order.deliveryMethod === 'self' && order.status === 'out_for_delivery');

/**
 * Dedicated customer code channel (BR-05, delivery BE `GET
 * /delivery/orders/{orderId}/code`): only the order's customer can decrypt
 * the current live generation; repeat reads return the same code. Reissue
 * stores a generation reference (never plaintext) as its idempotent result.
 */
@Injectable()
export class CustomerCodeService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(REALTIME_SIGNAL) private readonly realtime: RealtimeSignal,
    private readonly support: HandoverSupport,
    private readonly codes: DeliveryCodesService,
  ) {}

  read(request: HandoverCommand, orderId: string): Promise<DeliveryCode> {
    return this.uow.run(async (tx) => {
      await this.support.customerOrder(tx, request, orderId);
      const code = await this.usableCode(tx, orderId);
      return this.reveal(code);
    });
  }

  async reissue(request: HandoverCommand, orderId: string, input: DeliveryCodeReissue): Promise<DeliveryCode> {
    const resource = `/delivery/orders/${orderId}/code/reissue`;
    const receipt = await this.commands.run(
      this.support.command(request, 'delivery.code_reissue', resource, input),
      async (tx) => {
        const order = await this.support.customerOrder(tx, request, orderId);
        if (!usable(order)) throw new DomainError('DELIVERY_INVALID_TRANSITION');
        const now = this.support.clock.now();
        const live = await this.codes.codes.live(tx, orderId, true);
        if (!live) throw new DomainError('DELIVERY_CODE_NOT_READY');
        if (live.lockedAt) throw new DomainError('DELIVERY_CODE_LOCKED');
        if (live.generation !== input.expectedCodeVersion) throw new DomainError('DELIVERY_VERSION_CONFLICT');
        if (now.getTime() < live.reissueAvailableAt.getTime()) throw new DomainError('DELIVERY_CODE_COOLDOWN');
        const meta = await this.codes.reissue(tx, live, now);
        // Customer's other open views refresh their code card (ID only, never the code).
        await this.realtime.signal(tx, { kind: 'order', orderId, userIds: [order.customerUserId] });
        return { orderId, codeVersion: meta.codeVersion ?? live.generation + 1 };
      },
      {
        store: (result) => result,
        replay: async (tx, stored) => {
          await this.support.customerOrder(tx, request, orderId);
          return ReissueReceiptSchema.parse(stored);
        },
      },
    );
    // Re-decrypt only a still-live generation; never cached plaintext.
    return this.uow.run(async (tx) => {
      const code = await this.usableCode(tx, orderId);
      if (code.generation !== receipt.codeVersion) throw new DomainError('DELIVERY_VERSION_CONFLICT');
      return this.reveal(code);
    }) as Promise<DeliveryCode & JsonValue>;
  }

  private async usableCode(tx: TxContext, orderId: string): Promise<StoredDeliveryCode> {
    const code = await this.codes.codes.live(tx, orderId, false);
    if (!code) {
      const latest = await this.codes.codes.latest(tx, orderId);
      throw new DomainError(latest?.consumedAt ? 'DELIVERY_CODE_CONSUMED' : 'DELIVERY_CODE_NOT_READY');
    }
    const state = codeState(code, this.support.clock.now());
    if (state === 'locked') throw new DomainError('DELIVERY_CODE_LOCKED');
    if (state === 'expired') throw new DomainError('DELIVERY_CODE_EXPIRED');
    return code;
  }

  private reveal(code: StoredDeliveryCode): DeliveryCode {
    if (!code.codeCiphertext) throw new DomainError('DELIVERY_CODE_NOT_READY');
    return DeliveryCodeSchema.parse({
      orderId: code.orderId,
      kind: code.kind,
      code: this.codes.cipher.decrypt(code, code.codeCiphertext),
      codeVersion: code.generation,
      expiresAt: code.expiresAt.toISOString(),
      reissueAvailableAt: code.reissueAvailableAt.toISOString(),
    });
  }
}
