import { createHmac, timingSafeEqual } from 'node:crypto';
import { canonicalJson, type JsonValue } from '@apnatown/shared';
import { CursorSchema, IdSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import { DomainError } from '../errors/errors';

export const CURSOR_CODEC = Symbol('CURSOR_CODEC');

export interface CursorBinding {
  operation: string;
  sort: string;
  filters: JsonValue;
  scope: JsonValue;
}

const tupleSchema = z
  .array(z.union([z.string().max(512), z.number().int().safe()]))
  .min(1)
  .max(12)
  .refine((keys) => IdSchema.safeParse(keys.at(-1)).success);

const payloadSchema = z.strictObject({
  v: z.literal(1),
  binding: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  keys: tupleSchema,
});

export type CursorKeys = z.infer<typeof tupleSchema>;

export class CursorCodec {
  constructor(private readonly signingKey: string) {
    if (!/^[A-Za-z0-9_-]{43,128}$/.test(signingKey))
      throw new Error('INVALID_CURSOR_SIGNING_KEY');
  }

  encode(binding: CursorBinding, keys: CursorKeys): string {
    const payload = payloadSchema.parse({
      v: 1,
      binding: this.fingerprint(binding),
      keys,
    });
    const data = Buffer.from(canonicalJson(payload)).toString('base64url');
    const signature = this.mac('cursor', data);
    const cursor = Buffer.from(`${data}.${signature}`).toString('base64url');
    if (!CursorSchema.safeParse(cursor).success)
      throw new Error('CURSOR_PAYLOAD_TOO_LARGE');
    return cursor;
  }

  decode(cursor: string, binding: CursorBinding): CursorKeys {
    if (!CursorSchema.safeParse(cursor).success) return this.invalid();
    const envelope = Buffer.from(cursor, 'base64url');
    if (envelope.toString('base64url') !== cursor) return this.invalid();
    const parts = envelope.toString('utf8').split('.');
    const [data, signature] = parts;
    if (
      parts.length !== 2 ||
      !data ||
      !signature ||
      !/^[A-Za-z0-9_-]+$/.test(data) ||
      !/^[A-Za-z0-9_-]{43}$/.test(signature)
    )
      return this.invalid();
    const expected = Buffer.from(this.mac('cursor', data), 'base64url');
    const received = Buffer.from(signature, 'base64url');
    if (
      received.toString('base64url') !== signature ||
      !timingSafeEqual(expected, received)
    )
      return this.invalid();
    const bytes = Buffer.from(data, 'base64url');
    if (bytes.toString('base64url') !== data) return this.invalid();
    let decoded: unknown;
    try {
      decoded = JSON.parse(bytes.toString('utf8'));
    } catch (error) {
      if (error instanceof SyntaxError) return this.invalid();
      throw error;
    }
    const payload = payloadSchema.safeParse(decoded);
    if (!payload.success || payload.data.binding !== this.fingerprint(binding))
      return this.invalid();
    return payload.data.keys;
  }

  private fingerprint(binding: CursorBinding): string {
    return this.mac('binding', canonicalJson(binding));
  }

  private mac(purpose: string, value: string): string {
    return createHmac('sha256', this.signingKey)
      .update(`${purpose}\0${value}`)
      .digest('base64url');
  }

  private invalid(): never {
    throw new DomainError('COMMON_VALIDATION_FAILED');
  }
}
