import type { TxContext } from '../../../shared/persistence/ports';

export interface StoredSession {
  id: string;
  kind: 'anonymous' | 'authenticated';
  userId: string | null;
  tokenHash: Uint8Array;
  csrfToken: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  lastSeenAt: Date;
}
export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');
export interface SessionRepository {
  findByHash(tx: TxContext, hash: Uint8Array): Promise<StoredSession | null>;
  lock(tx: TxContext, id: string): Promise<StoredSession | null>;
  insert(tx: TxContext, session: StoredSession): Promise<void>;
  revoke(tx: TxContext, id: string, now: Date): Promise<void>;
  revokeUser(tx: TxContext, userId: string, now: Date): Promise<void>;
  touch(tx: TxContext, id: string, now: Date): Promise<void>;
}
