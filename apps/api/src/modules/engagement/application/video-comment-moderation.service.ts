import { Inject, Injectable } from '@nestjs/common';
import {
  VideoCommentAdminPageSchema,
  VideoCommentDecisionResultSchema,
  type VideoCommentAdminPage,
  type VideoCommentAdminQuery,
  type VideoCommentDecision,
  type VideoCommentDecisionResult,
} from '@apnatown/shared';
import type { JsonValue } from '@apnatown/shared';
import { ScopeRefSchema } from '@apnatown/shared/admin';
import { IdSchema, TimestampSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import { ADMIN_SCOPE, SESSION_ACCESS } from '../../../shared/auth/ports';
import type { AdminScopePort, SessionAccess } from '../../../shared/auth/ports';
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
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import { AUDIT_WRITER } from '../../audit/application/audit-writer.port';
import type { AuditWriter } from '../../audit/application/audit-writer.port';
import { MEDIA_COMMENT_TARGET } from '../../media-videos/application/video-comment-target.port';
import type {
  MediaCommentTarget,
  MediaCommentTargetPort,
} from '../../media-videos/application/video-comment-target.port';
import {
  VIDEO_COMMENT_REPOSITORY,
  type CommentPosition,
  type CommentScope,
  type CommentStatus,
  type StoredComment,
  type VideoCommentRepository,
  type VideoCommentRequest,
  scopeRef,
} from '../domain/comments';
import { VideoCommentEvents } from './video-comment-events';

const positionSchema = z.tuple([TimestampSchema, IdSchema]);
const RECEIPT_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class VideoCommentModerationService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY)
    private readonly contexts: HttpCommandContextFactory,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(ADMIN_SCOPE) private readonly adminScope: AdminScopePort,
    @Inject(AUDIT_WRITER) private readonly audit: AuditWriter,
    @Inject(VIDEO_COMMENT_REPOSITORY)
    private readonly comments: VideoCommentRepository,
    @Inject(MEDIA_COMMENT_TARGET)
    private readonly media: MediaCommentTargetPort,
    private readonly events: VideoCommentEvents,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  adminPage(
    request: VideoCommentRequest,
    query: VideoCommentAdminQuery,
  ): Promise<VideoCommentAdminPage> {
    return this.uow.run(async (tx) => {
      await this.requireActor(tx, request);
      const authority = await this.adminScope.authorize(
        {
          actorUserId: request.actorId,
          module: 'reviews',
          action: 'view',
          scopes: [],
        },
        tx,
      );
      const scope: CommentScope = authority.scope;
      const binding: CursorBinding = {
        operation: 'engagement.video_comments.admin',
        sort: 'createdAt-id-asc',
        filters: { status: query.status },
        scope: { actor: request.actorId, revision: authority.scopeRevision },
      };
      const after = this.position(query.cursor, binding);
      const rows = await this.comments.adminPage(tx, {
        status: query.status,
        scope,
        limit: query.limit,
        ...(after ? { after } : {}),
      });
      const counts = await this.comments.adminCounts(tx, scope);
      const items = rows.slice(0, query.limit).map((row) => this.adminDto(row));
      const last = items.at(-1);
      return VideoCommentAdminPageSchema.parse({
        items,
        counts,
        nextCursor:
          rows.length > query.limit && last
            ? this.cursors.encode(binding, [last.createdAt, last.id])
            : null,
      });
    });
  }

  decide(
    request: VideoCommentRequest,
    id: string,
    input: VideoCommentDecision,
  ): Promise<VideoCommentDecisionResult> {
    const command = this.contexts.create(
      {
        name: `engagement.video_comment.${input.action}`,
        method: 'POST',
        scope: 'principal',
        successStatus: 200,
      },
      {
        actorId: request.actorId,
        correlationId: request.correlationId,
        resource: `/admin/comments/${id}/decision`,
        business: null,
        expiresAt: new Date(this.clock.now().getTime() + RECEIPT_TTL_MS),
      },
      { key: request.key, payload: { id, ...input } as JsonValue },
    );
    const policy: IdempotencyResultPolicy<
      VideoCommentDecisionResult & JsonValue
    > = {
      store: (result) => result,
      replay: async (tx, stored) => {
        await this.requireActor(tx, request);
        const row = await this.comments.find(tx, id);
        if (!row) throw new DomainError('ENGAGEMENT_TARGET_NOT_FOUND');
        await this.authorizeComment(request, row, 'edit', tx);
        return VideoCommentDecisionResultSchema.parse(stored) as VideoCommentDecisionResult &
          JsonValue;
      },
    };
    return this.commands
      .run(
        command,
        async (tx) => this.decideInTransaction(tx, request, id, input),
        policy,
      )
      .then((result) => VideoCommentDecisionResultSchema.parse(result));
  }

  private async decideInTransaction(
    tx: TxContext,
    request: VideoCommentRequest,
    id: string,
    input: VideoCommentDecision,
  ): Promise<VideoCommentDecisionResult & JsonValue> {
    await this.requireActor(tx, request);
    const before = await this.comments.find(tx, id);
    if (!before) throw new DomainError('ENGAGEMENT_TARGET_NOT_FOUND');
    const { authority, target } = await this.authorizeComment(
      request,
      before,
      'edit',
      tx,
    );
    this.assertDecision(before, input);
    const status: CommentStatus =
      input.action === 'publish' ? 'published' : 'removed';
    const after = await this.comments.transition(tx, {
      id,
      expectedVersion: input.expectedVersion,
      fromStatus: before.status,
      status,
      reason: status === 'removed' ? input.reason! : null,
      at: this.clock.now(),
    });
    if (!after) throw new DomainError('COMMENT_VERSION_CONFLICT');
    const publishedCount = await this.comments.publishedCount(tx, after.videoId);
    const delta = ((status === 'published' ? 1 : 0) -
      (before.status === 'published' ? 1 : 0)) as -1 | 0 | 1;
    await this.events.transition(
      tx,
      after,
      target,
      before.status,
      delta,
      request.correlationId,
    );
    await this.events.moderated(
      tx,
      after,
      target,
      before.status,
      delta,
      request.correlationId,
    );
    await this.audit.record(tx, {
      actor: {
        userId: request.actorId,
        role: authority.isSuper ? 'super_admin' : 'admin',
        label: authority.isSuper ? 'Super Admin' : 'Admin',
      },
      action: `engagement.comment.${input.action}`,
      entityType: 'video_comment',
      entityId: id,
      cityId: before.cityId,
      areaId: before.areaId,
      relatedScopes: [scopeRef(before)],
      summary: `Video comment ${input.action}`,
      fields: ['status', 'reason', 'version'],
      before: this.auditSnapshot(before),
      after: this.auditSnapshot(after),
      correlationId: request.correlationId,
    });
    return {
      comment: this.adminDto(after),
      publishedCommentCount: publishedCount,
    } as VideoCommentDecisionResult & JsonValue;
  }

  private async authorizeComment(
    request: VideoCommentRequest,
    row: StoredComment,
    action: 'view' | 'edit',
    tx: TxContext,
  ) {
    const target = await this.media.find(tx, row.videoId);
    if (!target) throw new DomainError('ENGAGEMENT_TARGET_NOT_FOUND');
    const authority = await this.adminScope.authorize(
      {
        actorUserId: request.actorId,
        module: 'reviews',
        action,
        scopes: [
          ScopeRefSchema.parse({
            cityId: target.cityId,
            areaId: target.areaId,
          }),
        ],
      },
      tx,
    );
    return { authority, target };
  }

  private async requireActor(tx: TxContext, request: VideoCommentRequest) {
    const principal = await this.sessions.requirePrincipal(tx, request.session);
    if (principal.userId !== request.actorId)
      throw new DomainError('COMMON_FORBIDDEN');
  }

  private assertDecision(row: StoredComment, input: VideoCommentDecision): void {
    if (row.version !== input.expectedVersion)
      throw new DomainError('COMMENT_VERSION_CONFLICT');
    if (
      input.action === 'publish'
        ? row.status !== 'pending'
        : !['pending', 'published'].includes(row.status)
    )
      throw new DomainError('COMMENT_INVALID_TRANSITION');
  }

  private adminDto(row: StoredComment) {
    const allowedActions: ('publish' | 'remove')[] =
      row.status === 'pending'
        ? ['publish', 'remove']
        : row.status === 'published'
          ? ['remove']
          : [];
    return {
      id: row.id,
      videoId: row.videoId,
      businessId: row.businessId,
      authorLabel: row.authorLabel,
      text: row.text,
      status: row.status,
      reason: row.reason,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      allowedActions,
    };
  }

  private auditSnapshot(row: StoredComment) {
    return {
      status: row.status,
      reason: row.reason,
      version: row.version,
    } as const;
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
