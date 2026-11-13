import type { TxContext } from '../../../shared/persistence/ports';

export interface OtpChallenge {
  id: string;
  phoneCiphertext: string;
  phoneLookupHash: Uint8Array;
  codeHash: string;
  attemptCount: number;
  expiresAt: Date;
  resendAfter: Date;
  verifiedAt: Date | null;
  supersededAt: Date | null;
  createdAt: Date;
}
export const CHALLENGE_REPOSITORY = Symbol('CHALLENGE_REPOSITORY');
export interface ChallengeRepository {
  lockPhone(tx: TxContext, hash: Uint8Array): Promise<void>;
  latest(tx: TxContext, hash: Uint8Array): Promise<OtpChallenge | null>;
  countSince(tx: TxContext, hash: Uint8Array, since: Date): Promise<number>;
  find(tx: TxContext, id: string): Promise<OtpChallenge | null>;
  lock(tx: TxContext, id: string): Promise<OtpChallenge | null>;
  supersedePhone(tx: TxContext, hash: Uint8Array, now: Date): Promise<void>;
  supersede(tx: TxContext, id: string, now: Date): Promise<void>;
  insert(tx: TxContext, challenge: OtpChallenge): Promise<void>;
  failAttempt(tx: TxContext, id: string): Promise<void>;
  consume(tx: TxContext, id: string, now: Date): Promise<void>;
}
