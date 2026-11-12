import type {
  ConsentChannel,
  ConsentPurpose,
  ConsentSource,
} from '@apnatown/shared/users';
import type { TxContext } from '../../../shared/persistence/ports';

/** One append-only evidence row for an authenticated subject. */
export interface StoredConsent {
  id: string;
  userId: string;
  purpose: ConsentPurpose;
  channel: ConsentChannel;
  granted: boolean;
  noticeVersion: string | null;
  recordedAt: string;
  source: ConsentSource;
}
export const CONSENT_REPOSITORY = Symbol('CONSENT_REPOSITORY');
export interface ConsentRepository {
  /** Latest committed evidence for each recorded purpose/channel of one user. */
  latestForUser(tx: TxContext, userId: string): Promise<StoredConsent[]>;
  latest(
    tx: TxContext,
    userId: string,
    purpose: ConsentPurpose,
    channel: ConsentChannel,
  ): Promise<StoredConsent | null>;
  /** Append only; returns the row exactly as persisted. */
  insert(tx: TxContext, row: StoredConsent): Promise<StoredConsent>;
}
