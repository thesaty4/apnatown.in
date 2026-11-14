import { Inject, Injectable } from '@nestjs/common';
import type { VideoShareCreate } from '@apnatown/shared';
import {
  COMMAND_CONTEXT_FACTORY,
  HttpCommandContextFactory,
} from '../../../shared/idempotency/context';
import { DomainError } from '../../../shared/errors/errors';
import {
  EVENT_FACTORY,
  type EventFactory,
} from '../../../shared/events/event-factory';
import {
  OUTBOX_WRITER,
  type OutboxWriter,
} from '../../../shared/events/ports';
import {
  COMMAND_UNIT_OF_WORK,
  type CommandUnitOfWork,
} from '../../../shared/persistence/ports';
import {
  CLOCK,
  type Clock,
} from '../../../shared/runtime/providers';
import { MEDIA_COMMENT_TARGET } from '../../media-videos/application/video-comment-target.port';
import type { MediaCommentTargetPort } from '../../media-videos/application/video-comment-target.port';
import {
  VIDEO_SHARE_REPOSITORY,
  type VideoShareRepository,
  type VideoShareRequest,
} from '../domain/shares';

const RECEIPT_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class VideoSharesService {
  constructor(
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY)
    private readonly contexts: HttpCommandContextFactory,
    @Inject(VIDEO_SHARE_REPOSITORY)
    private readonly shares: VideoShareRepository,
    @Inject(MEDIA_COMMENT_TARGET)
    private readonly media: MediaCommentTargetPort,
    @Inject(EVENT_FACTORY) private readonly events: EventFactory,
    @Inject(OUTBOX_WRITER) private readonly outbox: OutboxWriter,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async create(
    request: VideoShareRequest,
    input: VideoShareCreate,
  ): Promise<void> {
    const command = this.contexts.create(
      {
        name: 'engagement.video_share.create',
        method: 'POST',
        scope: 'principal',
        successStatus: 204,
      },
      {
        actorId: request.actorId,
        correlationId: request.correlationId,
        resource: '/engagement/shares',
        business: null,
        expiresAt: new Date(this.clock.now().getTime() + RECEIPT_TTL_MS),
      },
      {
        key: request.key,
        payload: {
          targetType: input.targetType,
          targetId: input.targetId,
          channel: input.channel,
        },
      },
    );
    await this.commands.run(
      command,
      async (tx) => {
        const target = await this.media.find(tx, input.targetId);
        if (!target?.public) throw new DomainError('MEDIA_VIDEO_NOT_PUBLISHED');
        const counters = await this.shares.increment(input.targetId, this.clock.now(), tx);
        await this.outbox.append(
          tx,
          this.events.create(
            'engagement.shared',
            {
              type: 'video_engagement',
              id: input.targetId,
              version: counters.version,
            },
            {
              targetType: input.targetType,
              targetId: input.targetId,
              businessId: target.businessId,
              channel: input.channel,
              shareCount: counters.shareCount,
              version: counters.version,
            },
            request.correlationId,
          ),
        );
        // 204 commands must store no body (`IDEMPOTENCY_NO_CONTENT_RESULT_INVALID`).
        return null;
      },
      {
        store: () => null,
        replay: async (tx) => {
          const target = await this.media.find(tx, input.targetId);
          if (!target?.public) throw new DomainError('MEDIA_VIDEO_NOT_PUBLISHED');
          return null;
        },
      },
    );
  }
}
