import { createHmac } from 'node:crypto';

type HashPurpose = 'key' | 'request' | 'consumer-key' | 'consumer-request';

export class IdempotencyHasher {
  private readonly key: Buffer;

  constructor(key: string) {
    if (!/^[a-f0-9]{64}$/.test(key))
      throw new Error('INVALID_IDEMPOTENCY_HASH_KEY');
    this.key = Buffer.from(key, 'hex');
  }

  hash(purpose: HashPurpose, value: string): Buffer {
    return createHmac('sha256', this.key)
      .update(`idempotency-${purpose}-v1\0`)
      .update(value)
      .digest();
  }
}
