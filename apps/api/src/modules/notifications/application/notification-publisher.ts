import { Inject, Injectable } from '@nestjs/common';
import type { EventEnvelope } from '@apnatown/shared';
import {
  NOTIFICATION_PREFERENCE_DEFAULTS,
  NotificationLinkSchema,
  type NotificationChannelKind,
  type NotificationSuppressionReason,
  type NotificationTemplateKey,
} from '@apnatown/shared/notifications';
import type { UserRole } from '@apnatown/shared/users';
import type { Logger } from 'pino';
import { RUNTIME_LOGGER } from '../../../shared/logger/logger';
import type { TxContext } from '../../../shared/persistence/ports';
import {
  CLOCK,
  ID_PROVIDER,
  type Clock,
  type IdProvider,
} from '../../../shared/runtime/providers';
import {
  NOTIFICATION_REPOSITORY,
  PREFERENCE_REPOSITORY,
  type AlertScope,
  type NotificationRepository,
  type PreferenceRepository,
} from '../domain/notification';
import {
  NOTIFICATION_CHANNELS,
  type ChannelOutcome,
  type NotificationChannel,
} from './notification-ports';
import { TEMPLATE_CONTENT_VERSION, TEMPLATE_POLICY } from './notification-policy';

/** A resolved, role-bound recipient; `suppressed` records why it is ineligible. */
export interface NotificationRecipient {
  userId: string;
  audienceRole: UserRole;
  suppressed?: NotificationSuppressionReason;
}

/**
 * Internal NotifyCommand subset for template notices from trusted matrix
 * rules. Category/topic/intent/channels derive from the template policy.
 */
export interface NotifyCommand {
  templateKey: NotificationTemplateKey;
  params: Record<string, string>;
  link: string | null;
  resourceScope?: AlertScope;
  recipients: readonly NotificationRecipient[];
}

/**
 * Persists each logical message once (replay-safe unique key), then records
 * one outcome per policy channel. In-app publication honors the live `inapp`
 * preference; unavailable external channels are recorded as suppressed.
 */
@Injectable()
export class NotificationPublisher {
  private readonly channels: ReadonlyMap<NotificationChannelKind, NotificationChannel>;

  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notifications: NotificationRepository,
    @Inject(PREFERENCE_REPOSITORY)
    private readonly preferences: PreferenceRepository,
    @Inject(NOTIFICATION_CHANNELS) channels: readonly NotificationChannel[],
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    @Inject(RUNTIME_LOGGER) private readonly logger: Logger,
  ) {
    this.channels = new Map(channels.map((channel) => [channel.kind, channel]));
  }

  async notify(
    tx: TxContext,
    event: EventEnvelope,
    command: NotifyCommand,
  ): Promise<void> {
    const policy = TEMPLATE_POLICY[command.templateKey];
    const link =
      command.link === null ? null : NotificationLinkSchema.parse(command.link);
    const templateVersion = await this.notifications.activeTemplateVersion(
      tx,
      command.templateKey,
    );
    const seen = new Set<string>();
    let published = 0;
    for (const recipient of command.recipients) {
      const identity = `${recipient.userId}:${recipient.audienceRole}`;
      if (seen.has(identity)) continue;
      seen.add(identity);
      const at = this.clock.now();
      const id = this.ids.uuidv7();
      const inserted = await this.notifications.insert(tx, {
        id,
        userId: recipient.userId,
        audienceRole: recipient.audienceRole,
        ...policy,
        templateKey: command.templateKey,
        templateVersion: templateVersion ?? 1,
        contentVersion: TEMPLATE_CONTENT_VERSION,
        params: command.params,
        linkPath: link,
        resourceScope: command.resourceScope ?? null,
        sourceEventId: event.id,
        sourceType: event.type,
        sourceVersion: event.aggregateVersion,
        at,
      });
      // Crash-before-ack replay: the logical message already has outcomes.
      if (!inserted) continue;
      const preferences =
        (await this.preferences.find(tx, recipient.userId)) ??
        NOTIFICATION_PREFERENCE_DEFAULTS;
      for (const kind of policy.channels) {
        const outcome: ChannelOutcome = recipient.suppressed
          ? { status: 'suppressed', reason: recipient.suppressed }
          : templateVersion === null
            ? { status: 'suppressed', reason: 'policy_unresolved' }
            : await this.deliver(tx, kind, {
                notificationId: id,
                userId: recipient.userId,
                topic: policy.topic,
                intent: policy.intent,
                preferences,
                at,
              });
        if (kind === 'in_app' && outcome.status === 'delivered') published++;
        await this.notifications.recordDelivery(tx, {
          id: this.ids.uuidv7(),
          notificationId: id,
          channel: kind,
          status: outcome.status,
          suppressionReason:
            outcome.status === 'suppressed' ? outcome.reason : null,
          at,
        });
      }
    }
    // Counts and identifiers only; never recipients, params or bodies.
    this.logger.info({
      event: 'notifications.processed',
      eventId: event.id,
      sourceType: event.type,
      templateKey: command.templateKey,
      recipients: seen.size,
      published,
    });
  }

  private deliver(
    tx: TxContext,
    kind: NotificationChannelKind,
    input: Parameters<NotificationChannel['deliver']>[1],
  ): Promise<ChannelOutcome> {
    // Each channel runs its own send-time authorization (preference + live
    // consent) before reporting availability, so suppression is truthful.
    const channel = this.channels.get(kind);
    if (!channel)
      return Promise.resolve({ status: 'suppressed', reason: 'channel_disabled' });
    return channel.deliver(tx, input);
  }
}
