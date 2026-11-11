import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const OPAQUE_TOKENS = Symbol('OPAQUE_TOKENS');
export type OpaqueTokenPurpose = 'session' | 'data-request-completion';

export interface IssuedOpaqueToken {
  readonly token: string;
  readonly hash: Uint8Array;
}

export interface OpaqueTokens {
  issue(purpose: OpaqueTokenPurpose): IssuedOpaqueToken;
  hash(purpose: OpaqueTokenPurpose, token: string): Uint8Array;
  verify(
    purpose: OpaqueTokenPurpose,
    token: string,
    expectedHash: Uint8Array,
  ): boolean;
}

export class InvalidOpaqueTokenError extends Error {
  constructor() {
    super('INVALID_OPAQUE_TOKEN');
    this.name = 'InvalidOpaqueTokenError';
  }
}

export class SystemOpaqueTokens implements OpaqueTokens {
  issue(purpose: OpaqueTokenPurpose): IssuedOpaqueToken {
    const token = randomBytes(32).toString('base64url');
    return { token, hash: this.hash(purpose, token) };
  }

  hash(purpose: OpaqueTokenPurpose, token: string): Uint8Array {
    if (!['session', 'data-request-completion'].includes(purpose))
      throw new Error('INVALID_OPAQUE_TOKEN_PURPOSE');
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token))
      throw new InvalidOpaqueTokenError();
    const bytes = Buffer.from(token, 'base64url');
    if (bytes.length !== 32 || bytes.toString('base64url') !== token)
      throw new InvalidOpaqueTokenError();
    return createHash('sha256')
      .update(`apnatown:opaque-token:v1:${purpose}\0`)
      .update(bytes)
      .digest();
  }

  verify(
    purpose: OpaqueTokenPurpose,
    token: string,
    expectedHash: Uint8Array,
  ): boolean {
    if (!(expectedHash instanceof Uint8Array) || expectedHash.byteLength !== 32)
      throw new Error('INVALID_OPAQUE_TOKEN_HASH');
    return timingSafeEqual(this.hash(purpose, token), expectedHash);
  }
}
