import type { JsonValue } from '@apnatown/shared';
import type { DataExportSection } from '@apnatown/shared/users';
import type { TxContext } from '../../../shared/persistence/ports';

export const USER_DATA_OWNERS = Symbol('USER_DATA_OWNERS');

export interface UserDataExportPage {
  items: JsonValue[];
  /** Owner-internal continuation; never exposed to clients. */
  nextCursor: string | null;
}
export interface UserDataErasure {
  /** Stable, non-personal receipt; idempotent on requestId. */
  receipt: string;
  status: 'completed' | 'blocked';
  reasonCode?: string;
}

/**
 * Internal owner-scoped data port (spec: UserDataPort). Each owner module
 * registers one implementation for its export section; sections without a
 * registered owner are exported as explicitly unavailable.
 */
export interface UserDataPort {
  readonly section: DataExportSection;
  exportPage(
    input: { userId: string; cursor: string | null; limit: number },
    tx: TxContext,
  ): Promise<UserDataExportPage>;
  /** Absent when the owner's data is retained by policy rather than erased. */
  erase?(
    input: { userId: string; requestId: string; policyVersion: string },
    tx: TxContext,
  ): Promise<UserDataErasure>;
}
