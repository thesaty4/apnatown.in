import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import type { DeliveryCodeKind } from '@apnatown/shared/delivery';
import type { IdentityCrypto } from '../../../shared/auth/crypto';

export const DELIVERY_CODE_CIPHER = Symbol('DELIVERY_CODE_CIPHER');

interface CodeRef {
  readonly orderId: string;
  readonly kind: DeliveryCodeKind;
  readonly generation: number;
}

const context = (ref: CodeRef) => `delivery-code:${ref.orderId}:${ref.kind}:${ref.generation}`;

/**
 * BR-05 code material: CSPRNG 4-digit codes, a keyed HMAC bound to
 * order/kind/generation for constant-time verification and AES-GCM
 * ciphertext (PII key) so only the customer channel can re-read the same
 * generation. Keys stay outside the DB; plaintext never leaves this class
 * except to the dedicated customer code DTO.
 */
export class DeliveryCodeCipher {
  private readonly key: Buffer;

  constructor(
    hashKey: string,
    private readonly crypto: IdentityCrypto,
  ) {
    if (!/^[a-f0-9]{64}$/.test(hashKey)) throw new Error('INVALID_DELIVERY_CODE_KEY');
    this.key = Buffer.from(hashKey, 'hex');
  }

  generate(): string {
    return randomInt(0, 10_000).toString().padStart(4, '0');
  }

  hash(ref: CodeRef, code: string): Buffer {
    return createHmac('sha256', this.key)
      .update(`apnatown:delivery-code:v1\0${context(ref)}\0${code}`)
      .digest();
  }

  verify(ref: CodeRef, code: string, stored: Uint8Array): boolean {
    const expected = Buffer.from(stored);
    const actual = this.hash(ref, code);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }

  encrypt(ref: CodeRef, code: string): Buffer {
    return Buffer.from(this.crypto.encrypt(code, context(ref)), 'utf8');
  }

  decrypt(ref: CodeRef, ciphertext: Uint8Array): string {
    return this.crypto.decrypt(Buffer.from(ciphertext).toString('utf8'), context(ref));
  }
}
