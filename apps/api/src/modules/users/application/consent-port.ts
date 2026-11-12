import type {
  ConsentChannel,
  ConsentPurpose,
  ConsentSource,
} from '@apnatown/shared/users';
import type { TxContext } from '../../../shared/persistence/ports';

export const CONSENT_READ = Symbol('CONSENT_READ');
export const CONSENT_WRITE = Symbol('CONSENT_WRITE');

export interface ConsentChoiceKey {
  userId: string;
  purpose: ConsentPurpose;
  channel: ConsentChannel;
}
/** Read at send time; absence of evidence is never consent (BR-11). */
export interface ConsentReadPort {
  current(
    input: ConsentChoiceKey,
    tx?: TxContext,
  ): Promise<{ granted: boolean; consentId?: string; recordedAt?: string }>;
}
export interface ConsentWriteInput extends ConsentChoiceKey {
  granted: boolean;
  source: ConsentSource;
  /** Required for grants and must equal the configured current notice. */
  noticeVersion?: string;
}
/**
 * Runs inside the caller's transaction, serializes per subject, appends
 * evidence and publishes `consent.granted|withdrawn` only on an effective change.
 * Requires an active correlation context (HTTP request or event consumer).
 */
export interface ConsentWritePort {
  record(
    tx: TxContext,
    input: ConsentWriteInput,
  ): Promise<{ consentId: string; recordedAt: string }>;
}
