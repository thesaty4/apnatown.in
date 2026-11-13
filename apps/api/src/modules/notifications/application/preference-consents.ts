import { Inject, Injectable } from '@nestjs/common';
import {
  NOTIFICATION_PREFERENCE_KEYS,
  type NotificationPreferenceKey,
} from '@apnatown/shared/notifications';
import type { ConsentChannel, ConsentPurpose } from '@apnatown/shared/users';
import { DomainError } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';
import {
  CONSENT_READ,
  CONSENT_WRITE,
  type ConsentReadPort,
  type ConsentWritePort,
} from '../../users/application/consent-port';

export interface PreferencePair {
  purpose: ConsentPurpose;
  channel: ConsentChannel;
  /** Enabling the key needs a current grant (WhatsApp, BR-11). */
  required: boolean;
}

/**
 * Users purpose registry mapping (spec preferences rule 4). In-app/email
 * transactional updates honor the preference only; their marketing pair is
 * displayed and may be granted by explicit acknowledgement.
 */
export const PREFERENCE_PAIRS: Readonly<
  Record<NotificationPreferenceKey, PreferencePair>
> = Object.freeze({
  inapp: { purpose: 'marketing', channel: 'in_app', required: false },
  email: { purpose: 'marketing', channel: 'email', required: false },
  wa_orders: { purpose: 'order_updates', channel: 'whatsapp', required: true },
  wa_offers: { purpose: 'marketing', channel: 'whatsapp', required: true },
  wa_enq: { purpose: 'enquiry_updates', channel: 'whatsapp', required: true },
});

export interface PreferenceConsentView {
  key: NotificationPreferenceKey;
  purpose: ConsentPurpose;
  channel: ConsentChannel;
  required: boolean;
  granted: boolean;
  consentId: string | null;
  recordedAt: string | null;
}

/** Consent reads/writes strictly through the Users public ports. */
@Injectable()
export class PreferenceConsents {
  constructor(
    @Inject(CONSENT_READ) private readonly reads: ConsentReadPort,
    @Inject(CONSENT_WRITE) private readonly writes: ConsentWritePort,
  ) {}

  async view(tx: TxContext, userId: string): Promise<PreferenceConsentView[]> {
    const views: PreferenceConsentView[] = [];
    for (const key of NOTIFICATION_PREFERENCE_KEYS) {
      const pair = PREFERENCE_PAIRS[key];
      const current = await this.reads.current(
        { userId, purpose: pair.purpose, channel: pair.channel },
        tx,
      );
      views.push({
        key,
        ...pair,
        granted: current.granted,
        consentId: current.granted ? (current.consentId ?? null) : null,
        recordedAt: current.granted ? (current.recordedAt ?? null) : null,
      });
    }
    return views;
  }

  /** Evidence-bearing grant; an unapproved/mismatched notice is CONSENT_REQUIRED. */
  async grant(
    tx: TxContext,
    userId: string,
    pair: PreferencePair,
    noticeVersion: string,
  ): Promise<void> {
    try {
      await this.writes.record(tx, {
        userId,
        purpose: pair.purpose,
        channel: pair.channel,
        granted: true,
        source: 'notification_preferences',
        noticeVersion,
      });
    } catch (error) {
      if (error instanceof DomainError && error.code === 'CONSENT_NOTICE_INVALID')
        throw new DomainError('CONSENT_REQUIRED');
      throw error;
    }
  }

  /** Withdrawal never needs a notice; Users dedupes no-op changes. */
  withdraw(
    tx: TxContext,
    userId: string,
    pair: Pick<PreferencePair, 'purpose' | 'channel'>,
    source: 'notification_preferences' | 'marketing_unsubscribe',
  ): Promise<{ consentId: string; recordedAt: string }> {
    return this.writes.record(tx, {
      userId,
      purpose: pair.purpose,
      channel: pair.channel,
      granted: false,
      source,
    });
  }
}
