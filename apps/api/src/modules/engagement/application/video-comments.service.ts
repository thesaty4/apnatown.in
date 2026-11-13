import { Inject, Injectable } from '@nestjs/common';
import {
  VideoCommentSchema,
  type VideoComment,
  type VideoCommentCreate,
} from '@apnatown/shared';
import type { JsonValue } from '@apnatown/shared';
import { IdSchema, TimestampSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import { SESSION_ACCESS } from '../../../shared/auth/ports';
import type { SessionAccess } from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import {
  COMMAND_CONTEXT_FACTORY,
  HttpCommandContextFactory,
} from '../../../shared/idempotency/context';
import {
  CURSOR_CODEC,
  type CursorBinding,
  type CursorCodec,
} from '../../../shared/pagination/cursor';
import {
  COMMAND_UNIT_OF_WORK,
  UNIT_OF_WORK,
  type CommandUnitOfWork,
  type IdempotencyResultPolicy,
  type TxContext,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import {
  CLOCK,
  ID_PROVIDER,
  type Clock,
  type IdProvider,
} from '../../../shared/runtime/providers';
import { MEDIA_COMMENT_TARGET } from '../../media-videos/application/video-comment-target.port';
import type {
  MediaCommentTarget,
  MediaCommentTargetPort,
} from '../../media-videos/application/video-comment-target.port';
import { SETTINGS_READ } from '../../settings/application/settings-ports';
import type { SettingsReadPort } from '../../settings/application/settings-ports';
import {
  VIDEO_COMMENT_REPOSITORY,
  type CommentPosition,
  type StoredComment,
  type VideoCommentRepository,
  type VideoCommentRequest,
} from '../domain/comments';
import { VideoCommentEvents } from './video-comment-events';

const positionSchema = z.tuple([TimestampSchema, IdSchema]);
const RECEIPT_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class VideoCommentsService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY)
    private readonly contexts: HttpCommandContextFactory,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(VIDEO_COMMENT_REPOSITORY)
    private readonly comments: VideoCommentRepository,
    @Inject(MEDIA_COMMENT_TARGET)
    private readonly media: MediaCommentTargetPort,
    @Inject(SETTINGS_READ) private readonly settings: SettingsReadPort,
    private readonly events: VideoCommentEvents,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
  ) {}

  create(
    request: VideoCommentRequest,
    videoId: string,
    input: VideoCommentCreate,
  ): Promise<VideoComment> {
    const body = { text: input.text.trim() };
    const command = this.contexts.create(
      { name: 'engagement.video_comment.create', method: 'POST', scope: 'principal', successStatus: 201 },
      {
        actorId: request.actorId,
        correlationId: request.correlationId,
        resource: `/videos/${videoId}/comments`,
        business: null,
        expiresAt: new Date(this.clock.now().getTime() + RECEIPT_TTL_MS),
      },
      { key: request.key, payload: body },
    );
    const policy: IdempotencyResultPolicy<VideoComment & JsonValue> = {
      store: (result) => result,
      replay: async (tx, stored) => {
        await this.requireCustomer(tx, request);
        const target = await this.requirePublicTarget(tx, videoId);
        const result = VideoCommentSchema.parse(stored);
        const row = await this.comments.find(tx, result.id);
        if (
          !row ||
          row.videoId !== target.id ||
          row.authorUserId !== request.actorId
        )
          throw new DomainError('ENGAGEMENT_TARGET_NOT_FOUND');
        return result as VideoComment & JsonValue;
      },
    };
    return this.commands
      .run(
        command,
        async (tx) => {
          await this.requireCustomer(tx, request);
          const target = await this.requirePublicTarget(tx, videoId);
          const reviewRules = await this.settings.get('reviews', tx);
          const blockedWords = reviewRules?.value.blockedWords ?? [];
          const status = flagged(body.text, blockedWords)
            ? 'pending'
            : 'published';
          const at = this.clock.now();
          const row = await this.comments.insert(tx, {
            id: this.ids.uuidv7(),
            videoId,
            authorUserId: request.actorId,
            text: body.text,
            status,
            at,
          });
          await this.events.transition(
            tx,
            row,
            target,
            null,
            status === 'published' ? 1 : 0,
            request.correlationId,
          );
          return this.dto(row) as VideoComment & JsonValue;
        },
        policy,
      )
      .then((result) => VideoCommentSchema.parse(result));
  }

  publicPage(videoId: string, authorUserId: string | null, query: {
    cursor?: string;
    limit: number;
  }) {
    return this.uow.run(async (tx) => {
      const target = await this.media.find(tx, videoId);
      if (!target) throw new DomainError('MEDIA_VIDEO_NOT_PUBLISHED');
      const binding: CursorBinding = {
        operation: 'engagement.video_comments.public',
        sort: 'createdAt-id-desc',
        filters: { videoId },
        scope: { author: authorUserId },
      };
      const after = this.position(query.cursor, binding);
      const rows = await this.comments.publicPage(tx, {
        videoId,
        authorUserId,
        public: target.public,
        limit: query.limit,
        ...(after ? { after } : {}),
      });
      const items = rows.slice(0, query.limit).map((row) => ({
        ...this.dto(row),
        canDelete: authorUserId !== null && row.authorUserId === authorUserId,
      }));
      const last = items.at(-1);
      return {
        items,
        nextCursor:
          rows.length > query.limit && last
            ? this.cursors.encode(binding, [last.createdAt, last.id])
            : null,
      };
    });
  }

  async removeByAuthor(
    request: VideoCommentRequest,
    videoId: string,
    commentId: string,
  ): Promise<void> {
    await this.uow.run(async (tx) => {
      await this.requireCustomer(tx, request);
      const before = await this.comments.find(tx, commentId);
      if (
        !before ||
        before.videoId !== videoId ||
        before.authorUserId !== request.actorId
      )
        throw new DomainError('ENGAGEMENT_TARGET_NOT_FOUND');
      if (before.status === 'removed') return;
      const removed = await this.comments.removeByAuthor(tx, {
        id: commentId,
        authorUserId: request.actorId,
        at: this.clock.now(),
      });
      if (!removed) {
        const latest = await this.comments.find(tx, commentId);
        if (latest?.status === 'removed') return;
        throw new DomainError('ENGAGEMENT_TARGET_NOT_FOUND');
      }
      const target = await this.media.find(tx, videoId);
      if (target)
        await this.events.transition(
          tx,
          removed.comment,
          target,
          removed.fromStatus,
          removed.fromStatus === 'published' ? -1 : 0,
          request.correlationId,
        );
    });
  }

  private async requirePublicTarget(
    tx: TxContext,
    videoId: string,
  ): Promise<MediaCommentTarget> {
    const target = await this.media.find(tx, videoId);
    if (!target?.public) throw new DomainError('MEDIA_VIDEO_NOT_PUBLISHED');
    return target;
  }

  private async requireCustomer(tx: TxContext, request: VideoCommentRequest) {
    const principal = await this.sessions.requirePrincipal(tx, request.session);
    if (principal.userId !== request.actorId || !principal.roles.includes('customer'))
      throw new DomainError('COMMON_FORBIDDEN');
    return principal;
  }

  private dto(row: StoredComment): VideoComment {
    return VideoCommentSchema.parse({
      id: row.id,
      videoId: row.videoId,
      authorLabel: row.authorLabel,
      text: row.text,
      status: row.status,
      reason: row.reason,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private position(
    cursor: string | undefined,
    binding: CursorBinding,
  ): CommentPosition | null {
    if (!cursor) return null;
    const parsed = positionSchema.safeParse(this.cursors.decode(cursor, binding));
    if (!parsed.success) throw new DomainError('VALIDATION_ERROR');
    return { createdAt: parsed.data[0], id: parsed.data[1] };
  }
}

function flagged(text: string, blockedWords: readonly string[]): boolean {
  const normalized = text.normalize('NFKC').toLowerCase();
  const hasUrl =
    /(?:https?:\/\/|www\.)[^\s]+|\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?:\/[^\s]*)?/iu.test(
      text,
    );
  return (
    hasUrl ||
    blockedWords.some((word) =>
      normalized.includes(word.normalize('NFKC').toLowerCase()),
    )
  );
}
