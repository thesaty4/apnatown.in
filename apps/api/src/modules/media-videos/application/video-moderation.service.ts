import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  MediaReportDecisionSchema,
  MediaReportDecisionResultSchema,
  SafeVideoPlaybackSchema,
  VideoModerationDecisionSchema,
  VideoModerationItemSchema,
  VideoModerationPageSchema,
  VideoReportQueueItemSchema,
  VideoSourceSchema,
  type VideoModerationDecision,
  type VideoModerationItem,
  type MediaReportDecision,
  type MediaReportDecisionResult,
  type VideoModerationQuery,
} from '@apnatown/shared';
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
import { videoPlayback } from '../domain/video-source';
import {
  VIDEO_REPOSITORY,
  type StoredModerationVideo,
  type StoredVideo,
  type VideoModerationRequest,
  type VideoModerationScope,
  type VideoPosition,
  type StoredVideoReport,
  type VideoRepository,
} from '../domain/videos';

const positionSchema = z.tuple([TimestampSchema, IdSchema]);
const RECEIPT_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class VideoModerationService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY)
    private readonly contexts: HttpCommandContextFactory,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(ADMIN_SCOPE) private readonly adminScope: AdminScopePort,
    @Inject(AUDIT_WRITER) private readonly audit: AuditWriter,
    @Inject(VIDEO_REPOSITORY) private readonly videos: VideoRepository,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  list(request: VideoModerationRequest, query: VideoModerationQuery) {
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
      const scope: VideoModerationScope = authority.scope;
      const binding: CursorBinding = {
        operation: 'media.videos.moderation',
        sort: 'createdAt-id-desc',
        filters: { tab: query.tab },
        scope: {
          actor: request.actorId,
          revision: authority.scopeRevision,
        },
      };
      const after = this.position(query.cursor, binding);
      const counts = await this.videos.moderationCounts(tx, scope);
      if (query.tab === 'reported') {
        const rows = await this.videos.reportedPage(tx, {
          scope,
          limit: query.limit,
          ...(after ? { after: { createdAt: after.createdAt, id: after.id } } : {}),
        });
        const items = rows
          .slice(0, query.limit)
          .map((row) => this.reportDto(row));
        const last = items.at(-1);
        return VideoModerationPageSchema.parse({
          items,
          counts,
          nextCursor:
            rows.length > query.limit && last
              ? this.cursors.encode(binding, [last.createdAt, last.reportId])
              : null,
        });
      }

      const rows = await this.videos.moderationPage(tx, {
        tab: query.tab,
        scope,
        limit: query.limit,
        ...(after ? { after } : {}),
      });
      const items = rows
        .slice(0, query.limit)
        .map((row) => ({ queueItemType: 'video' as const, ...this.dto(row) }));
      const last = items.at(-1);
      return VideoModerationPageSchema.parse({
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
    request: VideoModerationRequest,
    id: string,
    input: VideoModerationDecision,
  ): Promise<VideoModerationItem> {
    const decision = VideoModerationDecisionSchema.parse(input);
    const payload = { id, ...decision };
    const command = this.contexts.create(
      {
        name: `media.video.${decision.action}`,
        method: 'POST',
        scope: 'principal',
        successStatus: 200,
      },
      {
        actorId: request.actorId,
        correlationId: request.correlationId,
        resource: `/admin/videos/${id}/decision`,
        business: null,
        expiresAt: new Date(this.clock.now().getTime() + RECEIPT_TTL_MS),
      },
      {
        key: request.key,
        payload: JSON.parse(JSON.stringify(payload)) as JsonValue,
      },
    );
    const policy: IdempotencyResultPolicy<VideoModerationItem & JsonValue> = {
      store: (result) => result,
      replay: async (tx, stored) => {
        await this.requireActor(tx, request);
        const row = await this.videos.findForModeration(tx, id);
        if (!row) throw new DomainError('MEDIA_NOT_FOUND');
        await this.authorizeVideo(request, row, 'edit', tx);
        return VideoModerationItemSchema.parse(stored) as VideoModerationItem &
          JsonValue;
      },
    };
    return this.commands
      .run(
        command,
        async (tx) => {
          await this.requireActor(tx, request);
          const before = await this.videos.findForModeration(tx, id);
          if (!before) throw new DomainError('MEDIA_NOT_FOUND');
          const authority = await this.authorizeVideo(
            request,
            before,
            'edit',
            tx,
          );
          this.assertDecision(before, decision);
          const now = this.clock.now();
          const status = this.nextStatus(decision);
          const after = await this.videos.decide(tx, {
            id,
            expectedVersion: decision.expectedVersion,
            status,
            decisionReason:
              decision.action === 'reject'
                ? decision.reason!
                : decision.action === 'approve'
                  ? null
                  : (decision.reason ?? null),
            approvedAt: decision.action === 'approve' ? now : null,
          });
          if (!after) throw new DomainError('MEDIA_VERSION_CONFLICT');
          await this.audit.record(tx, {
            actor: {
              userId: request.actorId,
              role: authority.isSuper ? 'super_admin' : 'admin',
              label: authority.isSuper ? 'Super Admin' : 'Admin',
            },
            action: `media.video.${decision.action}`,
            entityType: 'video',
            entityId: id,
            cityId: before.cityId,
            areaId: before.areaId,
            relatedScopes: [this.scopeRef(before)],
            summary: `Video ${decision.action}`,
            fields: ['status', 'decisionReason', 'approvedAt', 'version'],
            before: this.auditSnapshot(before),
            after: this.auditSnapshot(after),
            correlationId: request.correlationId,
          });
          return this.dto(after) as VideoModerationItem & JsonValue;
        },
        policy,
      )
      .then((result) => VideoModerationItemSchema.parse(result));
  }

  resolveReport(
    request: VideoModerationRequest,
    id: string,
    input: MediaReportDecision,
  ): Promise<MediaReportDecisionResult> {
    const decision = MediaReportDecisionSchema.parse(input);
    const payload = { id, ...decision };
    const command = this.contexts.create(
      {
        name: `media.report.${decision.action}`,
        method: 'POST',
        scope: 'principal',
        successStatus: 200,
      },
      {
        actorId: request.actorId,
        correlationId: request.correlationId,
        resource: `/admin/media-reports/${id}/decision`,
        business: null,
        expiresAt: new Date(this.clock.now().getTime() + RECEIPT_TTL_MS),
      },
      {
        key: request.key,
        payload: JSON.parse(JSON.stringify(payload)) as JsonValue,
      },
    );
    const policy: IdempotencyResultPolicy<
      MediaReportDecisionResult & JsonValue
    > = {
      store: (result) => result,
      replay: async (tx, stored) => {
        await this.requireActor(tx, request);
        const report = await this.videos.findReportForModeration(tx, id);
        if (!report) throw new DomainError('MEDIA_NOT_FOUND');
        await this.authorizeVideo(request, report.video, 'edit', tx);
        return MediaReportDecisionResultSchema.parse(
          stored,
        ) as MediaReportDecisionResult & JsonValue;
      },
    };
    return this.commands
      .run(
        command,
        async (tx) => {
          await this.requireActor(tx, request);
          const report = await this.videos.findReportForModeration(tx, id);
          if (!report) throw new DomainError('MEDIA_NOT_FOUND');
          const authority = await this.authorizeVideo(
            request,
            report.video,
            'edit',
            tx,
          );
          if (report.status !== 'open')
            throw new DomainError('MEDIA_VERSION_CONFLICT');
          if (
            report.reportVersion !== decision.expectedVersion ||
            report.video.version !== decision.targetVersion
          )
            throw new DomainError('MEDIA_VERSION_CONFLICT');
          if (
            decision.action === 'remove' &&
            (report.video.status === 'removed' ||
              report.video.ownerDeletedAt)
          )
            throw new DomainError('VIDEO_INVALID_TRANSITION');

          const now = this.clock.now();
          const result = await this.videos.resolveReport(tx, {
            reportId: id,
            expectedVersion: decision.expectedVersion,
            targetVersion: decision.targetVersion,
            action: decision.action,
            reason: decision.reason ?? null,
            resolvedAt: now,
          });
          if (!result) throw new DomainError('MEDIA_VERSION_CONFLICT');
          const resolution =
            decision.action === 'dismiss' ? 'dismissed' : 'removed';
          await this.audit.record(tx, {
            actor: {
              userId: request.actorId,
              role: authority.isSuper ? 'super_admin' : 'admin',
              label: authority.isSuper ? 'Super Admin' : 'Admin',
            },
            action: `media.report.${decision.action}`,
            entityType: 'media_report',
            entityId: report.reportId,
            cityId: report.video.cityId,
            areaId: report.video.areaId,
            relatedScopes: [this.scopeRef(report.video)],
            summary: `Media report ${decision.action}`,
            fields: ['status', 'resolution', 'version'],
            before: {
              status: report.status,
              resolution: report.resolution,
              version: report.reportVersion,
            },
            after: {
              status: 'resolved',
              resolution,
              version: result.reportVersion,
            },
            correlationId: request.correlationId,
          });
          if (decision.action === 'remove') {
            await this.audit.record(tx, {
              actor: {
                userId: request.actorId,
                role: authority.isSuper ? 'super_admin' : 'admin',
                label: authority.isSuper ? 'Super Admin' : 'Admin',
              },
              action: 'media.video.remove_report',
              entityType: 'video',
              entityId: report.video.id,
              cityId: report.video.cityId,
              areaId: report.video.areaId,
              relatedScopes: [this.scopeRef(report.video)],
              summary: 'Video removed after media report',
              fields: ['status', 'decisionReason', 'approvedAt', 'version'],
              before: this.auditSnapshot(report.video),
              after: {
                status: result.targetStatus,
                decisionReason: decision.reason ?? null,
                approvedAt: null,
                version: result.targetVersion,
              },
              correlationId: request.correlationId,
            });
          }
          return MediaReportDecisionResultSchema.parse({
            reportId: id,
            status: 'resolved',
            resolution,
            reportVersion: result.reportVersion,
            targetStatus: result.targetStatus,
            targetVersion: result.targetVersion,
            targetKind: 'video',
          }) as MediaReportDecisionResult & JsonValue;
        },
        policy,
      )
      .then((result) => MediaReportDecisionResultSchema.parse(result));
  }

  private async requireActor(tx: TxContext, request: VideoModerationRequest) {
    const principal = await this.sessions.requirePrincipal(tx, request.session);
    if (principal.userId !== request.actorId)
      throw new DomainError('SESSION_EXPIRED');
  }

  private async authorizeVideo(
    request: VideoModerationRequest,
    video: StoredModerationVideo,
    action: 'view' | 'edit',
    tx: TxContext,
  ) {
    return this.adminScope.authorize(
      {
        actorUserId: request.actorId,
        module: 'reviews',
        action,
        scopes: [this.scopeRef(video)],
      },
      tx,
    );
  }

  private scopeRef(video: StoredModerationVideo) {
    return ScopeRefSchema.parse({
      cityId: video.cityId,
      areaId: video.areaId,
    });
  }

  private assertDecision(
    video: StoredModerationVideo,
    decision: VideoModerationDecision,
  ) {
    if (video.version !== decision.expectedVersion)
      throw new DomainError('MEDIA_VERSION_CONFLICT');
    if (video.ownerDeletedAt)
      throw new DomainError('VIDEO_INVALID_TRANSITION');
    if (
      (decision.action === 'reject' && video.status !== 'pending') ||
      (decision.action === 'remove' && video.status === 'removed') ||
      (decision.action === 'approve' && video.status === 'approved')
    )
      throw new DomainError('VIDEO_INVALID_TRANSITION');
  }

  private nextStatus(
    decision: VideoModerationDecision,
  ): StoredVideo['status'] {
    if (decision.action === 'approve') return 'approved';
    if (decision.action === 'reject') return 'rejected';
    return 'removed';
  }

  private position(
    cursor: string | undefined,
    binding: CursorBinding,
  ): VideoPosition | undefined {
    if (!cursor) return undefined;
    const parsed = positionSchema.safeParse(this.cursors.decode(cursor, binding));
    if (!parsed.success)
      throw new DomainError('VALIDATION_ERROR', { field: 'cursor' });
    return { createdAt: parsed.data[0], id: parsed.data[1] };
  }

  private dto(row: StoredModerationVideo): VideoModerationItem {
    return VideoModerationItemSchema.parse({
      id: row.id,
      provider: row.provider,
      kind: row.kind,
      providerId: row.providerId,
      status: row.status,
      caption: row.caption,
      hashtags: row.hashtags,
      showInGallery: row.showInGallery,
      showInReels: row.showInReels,
      version: row.version,
      createdAt: row.createdAt,
      playback: SafeVideoPlaybackSchema.parse(
        videoPlayback(
          VideoSourceSchema.parse({
            provider: row.provider,
            kind: row.kind,
            providerId: row.providerId,
          }),
        ),
      ),
      decisionReason: row.decisionReason,
      businessNameEn: row.businessNameEn,
      businessNameHi: row.businessNameHi,
    });
  }

  /** Also used by the typed admin media-report queue. */
  reportDto(row: StoredVideoReport) {
    return VideoReportQueueItemSchema.parse({
      queueItemType: 'report',
      reportId: row.reportId,
      targetKind: 'video',
      videoId: row.videoId,
      reason: row.reason,
      details: row.details,
      status: 'open',
      reportVersion: row.reportVersion,
      targetVersion: row.targetVersion,
      createdAt: row.createdAt,
      allowedActions:
        row.video.status === 'removed' || row.video.ownerDeletedAt
          ? ['dismiss']
          : ['dismiss', 'remove'],
      video: this.dto(row.video),
    });
  }

  private auditSnapshot(video: StoredModerationVideo): Record<string, JsonValue> {
    return {
      status: video.status,
      decisionReason: video.decisionReason,
      approvedAt: video.approvedAt,
      version: video.version,
    };
  }
}
