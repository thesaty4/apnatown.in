import { Injectable } from '@nestjs/common';
import {
  VideoCommentEventPayloadSchema,
  type EventEnvelope,
} from '@apnatown/shared';
import { SupportMessageSubmittedPayloadSchema } from '@apnatown/shared/settings';
import { z } from 'zod';
import type { TxContext } from '../../../../shared/persistence/ports';
import type { NotifyCommand } from '../notification-publisher';
import { NotificationRecipients } from '../notification-recipients';
import { payload, type NotificationRule } from '../notification-rule';
import { alertScope } from './alert-scope';

// The moderation event carries the base payload plus a moderator reason that
// Notifications never renders.
const ModeratedPayloadSchema = VideoCommentEventPayloadSchema.extend({
  reason: z.unknown().optional(),
});

/** `engagement.comment_pending` -> A(reviews, video scope). */
@Injectable()
export class CommentPendingRule implements NotificationRule {
  readonly name = 'comment-pending';
  readonly eventTypes = ['engagement.comment_pending'];
  constructor(private readonly recipients: NotificationRecipients) {}

  async command(tx: TxContext, event: EventEnvelope): Promise<NotifyCommand> {
    const input = payload(VideoCommentEventPayloadSchema, event);
    const scope = alertScope('reviews', input.scope.cityId, input.scope.areaId);
    return {
      templateKey: 'admin.alert',
      params: { subject: 'video_comment' },
      link: '/admin/videos?content=comments&tab=pending',
      resourceScope: scope,
      recipients: await this.recipients.admins(tx, scope),
    };
  }
}

/** `engagement.comment_moderated` -> comment author (customer). */
@Injectable()
export class CommentModeratedRule implements NotificationRule {
  readonly name = 'comment-moderated';
  readonly eventTypes = ['engagement.comment_moderated'];
  constructor(private readonly recipients: NotificationRecipients) {}

  async command(
    tx: TxContext,
    event: EventEnvelope,
  ): Promise<NotifyCommand | null> {
    const input = payload(ModeratedPayloadSchema, event);
    if (input.toStatus === 'pending' || input.fromStatus === input.toStatus)
      return null;
    return {
      templateKey: 'comment.decided',
      params: { status: input.toStatus },
      link: `/videos/${input.videoId}?commentId=${input.commentId}`,
      recipients: [
        await this.recipients.user(tx, input.authorUserId, 'customer'),
      ],
    };
  }
}

/**
 * `support.message_submitted` -> A(users, known scope); a global/unknown
 * scope resolves to super admins only (never all area admins).
 */
@Injectable()
export class SupportMessageRule implements NotificationRule {
  readonly name = 'support-message';
  readonly eventTypes = ['support.message_submitted'];
  constructor(private readonly recipients: NotificationRecipients) {}

  async command(tx: TxContext, event: EventEnvelope): Promise<NotifyCommand> {
    const input = payload(SupportMessageSubmittedPayloadSchema, event);
    const scope = alertScope('users', input.scope.cityId, input.scope.areaId);
    return {
      templateKey: 'support.received',
      params: {},
      link: `/admin/overview?supportMessageId=${input.messageId}`,
      resourceScope: scope,
      recipients: await this.recipients.admins(tx, scope),
    };
  }
}
