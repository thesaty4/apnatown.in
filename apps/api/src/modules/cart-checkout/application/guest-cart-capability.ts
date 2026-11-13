import { Inject, Injectable } from '@nestjs/common';
import { RUNTIME_CONFIG, type RuntimeConfig } from '../../../shared/config/config';
import {
  InvalidOpaqueTokenError,
  OPAQUE_TOKENS,
  type OpaqueTokens,
} from '../../../shared/runtime/opaque-token';

/**
 * Guest-cart capability (cart-checkout BE rule 1): a CSPRNG opaque token held
 * only in an httpOnly cookie and persisted only as its purpose-bound hash. It
 * is independent of Auth's session cookie and grants no authenticated access.
 * Lifetime is explicit configuration (Q-70); unset disables guest carts.
 */
@Injectable()
export class GuestCartCapability {
  readonly ttlSeconds: number | null;
  constructor(
    @Inject(RUNTIME_CONFIG) config: RuntimeConfig,
    @Inject(OPAQUE_TOKENS) private readonly tokens: OpaqueTokens,
  ) {
    this.ttlSeconds = config.GUEST_CART_TTL_SECONDS ?? null;
  }

  get enabled(): boolean {
    return this.ttlSeconds !== null;
  }

  /** Null for an absent, malformed or non-string cookie value. */
  hash(raw: unknown): Uint8Array | null {
    if (typeof raw !== 'string') return null;
    try {
      return this.tokens.hash('guest-cart', raw);
    } catch (error) {
      if (error instanceof InvalidOpaqueTokenError) return null;
      throw error;
    }
  }

  issue(): string {
    return this.tokens.issue('guest-cart').token;
  }

  /** Guest carts not written since this instant are expired. */
  notBefore(now: Date): Date | null {
    return this.ttlSeconds === null
      ? null
      : new Date(now.getTime() - this.ttlSeconds * 1000);
  }
}
