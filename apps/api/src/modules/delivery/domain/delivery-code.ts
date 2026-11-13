import type { DeliveryCodeKind, HandoverMeta } from '@apnatown/shared/delivery';
import type { TxContext } from '../../../shared/persistence/ports';

// TODO(verify): G-15/G-16 expiry, reissue cooldown and lock recovery are
// unresolved; these are documented local defaults, not approved policy.
export const DELIVERY_CODE_TTL_MS = 24 * 60 * 60 * 1000;
export const DELIVERY_CODE_REISSUE_COOLDOWN_MS = 60 * 1000;
export const DELIVERY_CODE_MAX_ATTEMPTS = 5;
export const HASH_KEY_VERSION = 'otp-hmac-v1';
export const ENCRYPTION_KEY_VERSION = 'pii-aesgcm-v1';

/** One code generation as stored; ciphertext is null once unusable. */
export interface StoredDeliveryCode {
  readonly id: string;
  readonly orderId: string;
  readonly kind: DeliveryCodeKind;
  readonly generation: number;
  readonly codeHash: Uint8Array;
  readonly codeCiphertext: Uint8Array | null;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly issuedAt: Date;
  readonly expiresAt: Date;
  readonly reissueAvailableAt: Date;
  readonly consumedAt: Date | null;
  readonly invalidatedAt: Date | null;
  readonly lockedAt: Date | null;
}

export interface NewDeliveryCode {
  readonly id: string;
  readonly orderId: string;
  readonly kind: DeliveryCodeKind;
  readonly generation: number;
  readonly codeHash: Uint8Array;
  readonly codeCiphertext: Uint8Array;
  readonly issuedAt: Date;
  readonly expiresAt: Date;
  readonly reissueAvailableAt: Date;
}

export const DELIVERY_CODE_REPOSITORY = Symbol('DELIVERY_CODE_REPOSITORY');
export interface DeliveryCodeRepository {
  /** The live (unconsumed, not invalidated) generation, optionally locked. */
  live(tx: TxContext, orderId: string, lock: boolean): Promise<StoredDeliveryCode | null>;
  /** Most recent generation of any state (metadata only). */
  latest(tx: TxContext, orderId: string): Promise<StoredDeliveryCode | null>;
  insert(tx: TxContext, code: NewDeliveryCode): Promise<void>;
  invalidateLive(tx: TxContext, orderId: string, at: Date): Promise<void>;
  /** Counts a wrong attempt; sets locked_at when the limit is reached. */
  recordFailure(tx: TxContext, id: string, at: Date): Promise<StoredDeliveryCode>;
  consume(
    tx: TxContext,
    input: { id: string; handoverId: string; actorUserId: string; at: Date },
  ): Promise<boolean>;
}

export type CodeState = HandoverMeta['state'];

/** Usable means live, unexpired and unlocked at `now`. */
export function codeState(code: StoredDeliveryCode | null, now: Date): CodeState {
  if (!code) return 'not_ready';
  if (code.consumedAt) return 'consumed';
  if (code.invalidatedAt) return 'not_ready';
  if (code.lockedAt) return 'locked';
  if (code.expiresAt.getTime() <= now.getTime()) return 'expired';
  return 'active';
}

/** Nonsecret metadata (`DeliveryOrderReadPort.handoverState`). */
export function handoverMeta(code: StoredDeliveryCode | null, now: Date): HandoverMeta {
  const state = codeState(code, now);
  if (!code || state === 'not_ready')
    return {
      kind: null,
      codeVersion: null,
      state: 'not_ready',
      expiresAt: null,
      reissueAvailableAt: null,
      attemptsRemaining: null,
    };
  return {
    kind: code.kind,
    codeVersion: code.generation,
    state,
    expiresAt: code.expiresAt.toISOString(),
    reissueAvailableAt: code.reissueAvailableAt.toISOString(),
    attemptsRemaining: Math.max(0, code.maxAttempts - code.attempts),
  };
}
