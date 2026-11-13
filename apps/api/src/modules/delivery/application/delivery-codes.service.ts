import { Inject, Injectable } from '@nestjs/common';
import type { DeliveryCodeKind, HandoverMeta } from '@apnatown/shared/delivery';
import type { TxContext } from '../../../shared/persistence/ports';
import { ID_PROVIDER, type IdProvider } from '../../../shared/runtime/providers';
import {
  DELIVERY_CODE_REISSUE_COOLDOWN_MS,
  DELIVERY_CODE_REPOSITORY,
  DELIVERY_CODE_TTL_MS,
  handoverMeta,
  type DeliveryCodeRepository,
  type StoredDeliveryCode,
} from '../domain/delivery-code';
import { DELIVERY_CODE_CIPHER, DeliveryCodeCipher } from './delivery-code-cipher';
import type { DeliveryCodesPort } from './delivery-codes-port';

/** Code issue/invalidate/metadata; the only writer of new generations. */
@Injectable()
export class DeliveryCodesService implements DeliveryCodesPort {
  constructor(
    @Inject(DELIVERY_CODE_REPOSITORY) readonly codes: DeliveryCodeRepository,
    @Inject(DELIVERY_CODE_CIPHER) readonly cipher: DeliveryCodeCipher,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
  ) {}

  async issue(tx: TxContext, input: { orderId: string; kind: DeliveryCodeKind; at: Date }) {
    const live = await this.codes.live(tx, input.orderId, true);
    if (live && live.kind === input.kind) return handoverMeta(live, input.at);
    if (live) await this.codes.invalidateLive(tx, input.orderId, input.at);
    const latest = await this.codes.latest(tx, input.orderId);
    return this.insert(tx, input, latest?.kind === input.kind ? latest.generation + 1 : 1);
  }

  /** Replaces `previous` (expired/active, never locked) with generation + 1. */
  async reissue(tx: TxContext, previous: StoredDeliveryCode, at: Date): Promise<HandoverMeta> {
    await this.codes.invalidateLive(tx, previous.orderId, at);
    return this.insert(tx, { orderId: previous.orderId, kind: previous.kind, at }, previous.generation + 1);
  }

  invalidate(tx: TxContext, orderId: string, at: Date) {
    return this.codes.invalidateLive(tx, orderId, at);
  }

  async handoverState(tx: TxContext, orderId: string, now: Date) {
    return handoverMeta(await this.codes.latest(tx, orderId), now);
  }

  private async insert(
    tx: TxContext,
    input: { orderId: string; kind: DeliveryCodeKind; at: Date },
    generation: number,
  ): Promise<HandoverMeta> {
    const ref = { orderId: input.orderId, kind: input.kind, generation };
    const code = this.cipher.generate();
    const row = {
      id: this.ids.uuidv7(),
      ...ref,
      codeHash: this.cipher.hash(ref, code),
      codeCiphertext: this.cipher.encrypt(ref, code),
      issuedAt: input.at,
      expiresAt: new Date(input.at.getTime() + DELIVERY_CODE_TTL_MS),
      reissueAvailableAt: new Date(input.at.getTime() + DELIVERY_CODE_REISSUE_COOLDOWN_MS),
    };
    await this.codes.insert(tx, row);
    return handoverMeta(
      { ...row, attempts: 0, maxAttempts: 5, consumedAt: null, invalidatedAt: null, lockedAt: null },
      input.at,
    );
  }
}
