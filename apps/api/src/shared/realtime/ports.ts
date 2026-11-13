import type { RealtimeSignalKind } from '@apnatown/shared/realtime';
import type { TxContext } from '../persistence/ports';

/** PostgreSQL LISTEN/NOTIFY channel shared by producers (API/worker) and the API hub. */
export const REALTIME_CHANNEL = 'apnatown_realtime';

export const REALTIME_SIGNAL = Symbol('REALTIME_SIGNAL');

export interface RealtimeSignalInput {
  readonly userIds: readonly string[];
  readonly kind: RealtimeSignalKind;
  /** Reference only; never a code, amount, address or name. */
  readonly orderId?: string;
  /** `delivery` kind only: the rider's offer/job reference. */
  readonly jobId?: string;
}

/**
 * Transactional "something changed for these users" hint. Enqueued inside
 * the caller's transaction, so it is delivered only if that work commits
 * (and dropped on rollback). Best-effort: clients must still refetch REST.
 */
export interface RealtimeSignal {
  signal(tx: TxContext, input: RealtimeSignalInput): Promise<void>;
}
