import { Inject, Injectable } from '@nestjs/common';
import { VideoCommentEventPayloadSchema } from '@apnatown/shared';
import type { JsonValue } from '@apnatown/shared';
import {
  EVENT_FACTORY,
  type EventFactory,
} from '../../../shared/events/event-factory';
import {
  OUTBOX_WRITER,
  type OutboxWriter,
} from '../../../shared/events/ports';
import type { TxContext } from '../../../shared/persistence/ports';
import type { MediaCommentTarget } from '../../media-videos/application/video-comment-target.port';
import type {
  CommentStatus,
  StoredComment,
} from '../domain/comments';

@Injectable()
export class VideoCommentEvents {
  constructor(
    @Inject(EVENT_FACTORY) private readonly factory: EventFactory,
    @Inject(OUTBOX_WRITER) private readonly outbox: OutboxWriter,
  ) {}

  async transition(
    tx: TxContext,
    row: StoredComment,
    target: MediaCommentTarget,
    fromStatus: CommentStatus | null,
    publishedCountDelta: -1 | 0 | 1,
    correlationId: string,
  ): Promise<void> {
    const payload = VideoCommentEventPayloadSchema.parse({
      commentId: row.id,
      videoId: row.videoId,
      businessId: target.businessId,
      authorUserId: row.authorUserId,
      scope: { cityId: target.cityId, areaId: target.areaId },
      fromStatus,
      toStatus: row.status,
      version: row.version,
      publishedCountDelta,
    });
    const type =
      row.status === 'pending'
        ? 'engagement.comment_pending'
        : row.status === 'published'
          ? 'engagement.comment_published'
          : 'engagement.comment_removed';
    await this.outbox.append(
      tx,
      this.factory.create(
        type,
        { type: 'video_comment', id: row.id, version: row.version },
        payload,
        correlationId,
      ),
    );
  }

  async moderated(
    tx: TxContext,
    row: StoredComment,
    target: MediaCommentTarget,
    fromStatus: CommentStatus,
    publishedCountDelta: -1 | 0 | 1,
    correlationId: string,
  ): Promise<void> {
    const payload = {
      ...VideoCommentEventPayloadSchema.parse({
        commentId: row.id,
        videoId: row.videoId,
        businessId: target.businessId,
        authorUserId: row.authorUserId,
        scope: { cityId: target.cityId, areaId: target.areaId },
        fromStatus,
        toStatus: row.status,
        version: row.version,
        publishedCountDelta,
      }),
      reason: row.reason,
    } as JsonValue;
    await this.outbox.append(
      tx,
      this.factory.create(
        'engagement.comment_moderated',
        { type: 'video_comment', id: row.id, version: row.version },
        payload,
        correlationId,
      ),
    );
  }
}
