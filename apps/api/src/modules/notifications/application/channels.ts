import { Inject, Injectable } from '@nestjs/common';
import type { NotificationPreferenceKey } from '@apnatown/shared/notifications';
import type { TxContext } from '../../../shared/persistence/ports';
import {
  CONSENT_READ,
  type ConsentReadPort,
} from '../../users/application/consent-port';
import {
  NOTIFICATION_REPOSITORY,
  type NotificationRepository,
} from '../domain/notification';
import type {
  ChannelDeliveryInput,
  ChannelOutcome,
  NotificationChannel,
} from './notification-ports';
import { PREFERENCE_PAIRS } from './preference-consents';

/**
 * In-app publication: one authorized write that sets in_app_published_at in
 * the consumer transaction. `inapp` off stops new publication only; it never
 * replays suppressed history when re-enabled.
 */
@Injectable()
export class InAppChannel implements NotificationChannel {
  readonly kind = 'in_app' as const;
  readonly available = true;

  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notifications: NotificationRepository,
  ) {}

  async deliver(
    tx: TxContext,
    input: ChannelDeliveryInput,
  ): Promise<ChannelOutcome> {
    if (!input.preferences.inapp)
      return { status: 'suppressed', reason: 'preference_off' };
    await this.notifications.publishInApp(tx, input.notificationId, input.at);
    return { status: 'delivered' };
  }
}

/**
 * External channel without a configured provider. Send-time authorization
 * still runs first, against live state only: the current preference key and
 * `ConsentReadPort.current` for the purpose/channel pair (WhatsApp always;
 * email only for marketing intent). It then records a truthful
 * `channel_disabled` suppression and makes no network call. A real adapter
 * must keep this gate immediately before every attempt or retry.
 */
abstract class UnavailableChannel implements NotificationChannel {
  abstract readonly kind: 'email' | 'whatsapp';
  readonly available = false;

  constructor(private readonly consents: ConsentReadPort) {}

  protected abstract gate(
    input: ChannelDeliveryInput,
  ): { key: NotificationPreferenceKey; consent: boolean } | null;

  async deliver(
    tx: TxContext,
    input: ChannelDeliveryInput,
  ): Promise<ChannelOutcome> {
    const gate = this.gate(input);
    if (!gate) return { status: 'suppressed', reason: 'policy_unresolved' };
    if (!input.preferences[gate.key])
      return { status: 'suppressed', reason: 'preference_off' };
    if (gate.consent) {
      const pair = PREFERENCE_PAIRS[gate.key];
      const current = await this.consents.current(
        { userId: input.userId, purpose: pair.purpose, channel: pair.channel },
        tx,
      );
      if (!current.granted)
        return { status: 'suppressed', reason: 'consent_withdrawn' };
    }
    return { status: 'suppressed', reason: 'channel_disabled' };
  }
}

/** TODO(verify): Q-04 email provider/sender not selected. */
@Injectable()
export class EmailChannel extends UnavailableChannel {
  readonly kind = 'email' as const;
  constructor(@Inject(CONSENT_READ) consents: ConsentReadPort) {
    super(consents);
  }
  protected gate(input: ChannelDeliveryInput) {
    // `email` gates email updates; marketing email also needs marketing consent.
    return { key: 'email' as const, consent: input.intent === 'marketing' };
  }
}

const WHATSAPP_KEYS: Partial<
  Record<ChannelDeliveryInput['topic'], NotificationPreferenceKey>
> = {
  orders: 'wa_orders',
  enquiries: 'wa_enq',
  offers: 'wa_offers',
  follower_updates: 'wa_offers',
};

/** TODO(verify): Q-04 WhatsApp BSP + approved templates not selected. */
@Injectable()
export class WhatsAppChannel extends UnavailableChannel {
  readonly kind = 'whatsapp' as const;
  constructor(@Inject(CONSENT_READ) consents: ConsentReadPort) {
    super(consents);
  }
  protected gate(input: ChannelDeliveryInput) {
    // Marketing intent always uses the marketing (wa_offers) pair.
    const key =
      input.intent === 'marketing' ? 'wa_offers' : WHATSAPP_KEYS[input.topic];
    return key ? { key, consent: true } : null;
  }
}
