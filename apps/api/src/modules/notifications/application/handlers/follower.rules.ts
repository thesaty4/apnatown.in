import { Inject, Injectable } from '@nestjs/common';
import {
  FOLLOWER_ANNOUNCEMENT_CREATED,
  FollowerAnnouncementCreatedPayloadSchema,
  type EventEnvelope,
  type FollowerAnnouncementKind,
} from '@apnatown/shared';
import type { TxContext } from '../../../../shared/persistence/ports';
import {
  FOLLOWER_ANNOUNCEMENT_CONTEXT,
  type FollowerAnnouncementContextPort,
} from '../follower-announcement-port';
import type { NotifyCommand } from '../notification-publisher';
import { NotificationRecipients } from '../notification-recipients';
import { payload, type NotificationRule } from '../notification-rule';

/** Untargeted announcements link to the kind's public listing (spec rule 5). */
const LISTING: Readonly<Record<FollowerAnnouncementKind, string>> = {
  product: '/explore?tab=products',
  service: '/explore?tab=services',
  offer: '/offers',
  video: '/videos',
};
/** TODO(verify): single-batch fan-out cap until resumable batching ships. */
const MAX_RECIPIENTS = 500;

/**
 * `engagement.announcement_created` -> `follower.announcement` to current
 * followers with the bell on (customer feed). Nothing is sent when the
 * business is no longer visible; preferences still apply in the publisher.
 */
@Injectable()
export class FollowerAnnouncementRule implements NotificationRule {
  readonly name = 'follower-announcement';
  readonly eventTypes = [FOLLOWER_ANNOUNCEMENT_CREATED];
  constructor(
    private readonly recipients: NotificationRecipients,
    @Inject(FOLLOWER_ANNOUNCEMENT_CONTEXT)
    private readonly announcements: FollowerAnnouncementContextPort,
  ) {}

  async command(tx: TxContext, event: EventEnvelope): Promise<NotifyCommand | null> {
    const input = payload(FollowerAnnouncementCreatedPayloadSchema, event);
    const context = await this.announcements.context(tx, input.announcementId, MAX_RECIPIENTS);
    if (!context?.businessVisible || !context.messageEn || !context.followerUserIds.length)
      return null;
    const params: Record<string, string> = {
      name: context.businessNameEn ?? '',
      message: context.messageEn,
    };
    if (context.businessNameHi) params.name_hi = context.businessNameHi;
    if (context.messageHi) params.message_hi = context.messageHi;
    return {
      templateKey: 'follower.announcement',
      params,
      link: LISTING[context.kind],
      recipients: await Promise.all(
        context.followerUserIds.map((userId) => this.recipients.user(tx, userId, 'customer')),
      ),
    };
  }
}
