import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  hkdfSync,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
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

const IV_BYTES = 12;
const TAG_BYTES = 16;

/**
 * Keys may hold ordered values derived from a caller's location (distance), so
 * the payload is sealed with AES-256-GCM as well as signed: signing alone would
 * leave it readable wherever the URL is logged.
 */
export class CursorCodec {
  private readonly sealingKey: Buffer;

  constructor(private readonly signingKey: string) {
    if (!/^[A-Za-z0-9_-]{43,128}$/.test(signingKey))
      throw new Error('INVALID_CURSOR_SIGNING_KEY');
    this.sealingKey = Buffer.from(
      hkdfSync('sha256', signingKey, '', 'apnatown.cursor.seal.v1', 32),
    );
  }

  encode(binding: CursorBinding, keys: CursorKeys): string {
    const payload = payloadSchema.parse({
      v: 1,
      binding: this.fingerprint(binding),
      keys,
    });
    const data = this.seal(Buffer.from(canonicalJson(payload))).toString(
      'base64url',
    );
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
    const plain = this.open(bytes);
    if (!plain) return this.invalid();
    let decoded: unknown;
    try {
      decoded = JSON.parse(plain.toString('utf8'));
    } catch (error) {
      if (error instanceof SyntaxError) return this.invalid();
      throw error;
    }
    const payload = payloadSchema.safeParse(decoded);
    if (!payload.success || payload.data.binding !== this.fingerprint(binding))
      return this.invalid();
    return payload.data.keys;
  }

  private seal(plain: Buffer): Buffer {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv('aes-256-gcm', this.sealingKey, iv);
    const sealed = Buffer.concat([cipher.update(plain), cipher.final()]);
    return Buffer.concat([iv, sealed, cipher.getAuthTag()]);
  }

  private open(bytes: Buffer): Buffer | null {
    if (bytes.length <= IV_BYTES + TAG_BYTES) return null;
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.sealingKey,
      bytes.subarray(0, IV_BYTES),
    );
    decipher.setAuthTag(bytes.subarray(bytes.length - TAG_BYTES));
    try {
      return Buffer.concat([
        decipher.update(bytes.subarray(IV_BYTES, bytes.length - TAG_BYTES)),
        decipher.final(),
      ]);
    } catch {
      return null;
    }
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
