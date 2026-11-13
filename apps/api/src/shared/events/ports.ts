import type { TxContext } from '../persistence/ports';
import type { DomainEvent } from './event-factory';

export const OUTBOX_WRITER = Symbol('OUTBOX_WRITER');

export interface OutboxWriter {
  append(tx: TxContext, event: DomainEvent): Promise<void>;
  /** Same transaction, one statement; every envelope validated first. */
  appendMany(tx: TxContext, events: readonly DomainEvent[]): Promise<void>;
}
