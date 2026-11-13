import { Inject, Injectable } from '@nestjs/common';
import {
  AdminMediaReportPageSchema,
  MediaReportDecisionResultSchema,
  MediaReportDecisionSchema,
  PhotoReportQueueItemSchema,
  type AdminMediaReportItem,
  type AdminMediaReportPage,
  type AdminMediaReportsQuery,
  type JsonValue,
  type MediaPhotoPlacementType,
  type MediaPublicQuery,
  type MediaReportDecision,
  type MediaReportDecisionResult,
} from '@apnatown/shared';
import { ScopeRefSchema } from '@apnatown/shared/admin';
import { IdSchema, TimestampSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import { ADMIN_SCOPE, SESSION_ACCESS, type AdminScopePort, type SessionAccess } from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import { COMMAND_CONTEXT_FACTORY, HttpCommandContextFactory } from '../../../shared/idempotency/context';
import { CURSOR_CODEC, type CursorBinding, type CursorCodec } from '../../../shared/pagination/cursor';
import {
  COMMAND_UNIT_OF_WORK, UNIT_OF_WORK, type CommandUnitOfWork, type TxContext, type UnitOfWork,
} from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import { AUDIT_WRITER, type AuditWriter } from '../../audit/application/audit-writer.port';
import { MEDIA_PHOTO_REPORTS, type PhotoReportRepository, type StoredPhotoReport } from '../domain/media-reports';
import { VIDEO_REPOSITORY, type VideoModerationRequest, type VideoRepository } from '../domain/videos';
import { publicImage } from './media-dto';
import { VideoModerationService } from './video-moderation.service';

const RECEIPT_TTL_MS = 24 * 60 * 60 * 1000;
const positionSchema = z.tuple([TimestampSchema, IdSchema]);
const parseResult = (value: unknown) =>
  MediaReportDecisionResultSchema.parse(value) as MediaReportDecisionResult & JsonValue;
/** Report placement → gateway placement/surface used for the admin preview. */
const PREVIEW: Record<MediaPhotoPlacementType, Pick<MediaPublicQuery, 'placementType' | 'surface'>> = {
  gallery_photo: { placementType: 'gallery_photo', surface: 'gallery' },
  product_image: { placementType: 'product', surface: 'card' },
  service_image: { placementType: 'service', surface: 'card' },
};
const newer = (a: AdminMediaReportItem, b: AdminMediaReportItem) =>
  a.createdAt === b.createdAt ? (a.reportId < b.reportId ? 1 : -1) : a.createdAt < b.createdAt ? 1 : -1;

/**
 * Typed admin media-report queue (video + photo) and photo report decisions.
 * Same `reviews` permission, stored business city/area scope, idempotency and
 * audit rules as video report decisions. Removing a photo marks its asset
 * `removed`, which every public Media view and the image gateway enforce.
 */
@Injectable()
export class MediaReportModerationService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY) private readonly contexts: HttpCommandContextFactory,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(ADMIN_SCOPE) private readonly adminScope: AdminScopePort,
    @Inject(AUDIT_WRITER) private readonly audit: AuditWriter,
    @Inject(VIDEO_REPOSITORY) private readonly videos: VideoRepository,
    @Inject(MEDIA_PHOTO_REPORTS) private readonly photos: PhotoReportRepository,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly videoModeration: VideoModerationService,
  ) {}

  queue(request: VideoModerationRequest, query: AdminMediaReportsQuery): Promise<AdminMediaReportPage> {
    return this.uow.run(async (tx) => {
      await this.requireActor(tx, request);
      const authority = await this.adminScope.authorize(
        { actorUserId: request.actorId, module: 'reviews', action: 'view', scopes: [] }, tx);
      const scope = authority.scope;
      const binding: CursorBinding = {
        operation: 'media.reports.admin',
        sort: 'createdAt-id-desc',
        filters: { targetKind: query.targetKind },
        scope: { actor: request.actorId, revision: authority.scopeRevision },
      };
      const raw = query.cursor ? positionSchema.safeParse(this.cursors.decode(query.cursor, binding)) : null;
      if (raw && !raw.success) throw new DomainError('VALIDATION_ERROR', { field: 'cursor' });
      const after = raw?.success ? { after: { createdAt: raw.data[0], id: raw.data[1] } } : {};
      const page = { scope, limit: query.limit, ...after };
      // Same keyset in both sources (limit + 1 each), merged by (createdAt, id) desc.
      const videoRows = query.targetKind === 'photo' ? [] : await this.videos.reportedPage(tx, page);
      const photoRows = query.targetKind === 'video' ? [] : await this.photos.page(tx, page);
      const merged: AdminMediaReportItem[] = [
        ...videoRows.map((row) => this.videoModeration.reportDto(row)),
        ...photoRows.map((row) => this.photoDto(row)),
      ].sort(newer);
      const items = merged.slice(0, query.limit);
      const last = items.at(-1);
      const video = (await this.videos.moderationCounts(tx, scope)).reported;
      const photo = await this.photos.openCount(tx, scope);
      return AdminMediaReportPageSchema.parse({
        items,
        nextCursor: merged.length > query.limit && last
          ? this.cursors.encode(binding, [last.createdAt, last.reportId])
          : null,
        counts: { total: video + photo, video, photo },
      });
    });
  }

  isPhotoReport(id: string): Promise<boolean> {
    return this.uow.run(async (tx) => (await this.photos.kind(tx, id)) === 'photo');
  }

  resolvePhoto(request: VideoModerationRequest, id: string, input: MediaReportDecision): Promise<MediaReportDecisionResult> {
    const decision = MediaReportDecisionSchema.parse(input);
    const command = this.contexts.create(
      { name: `media.report.${decision.action}`, method: 'POST', scope: 'principal', successStatus: 200 },
      {
        actorId: request.actorId,
        correlationId: request.correlationId,
        resource: `/admin/media-reports/${id}/decision`,
        business: null,
        expiresAt: new Date(this.clock.now().getTime() + RECEIPT_TTL_MS),
      },
      { key: request.key, payload: JSON.parse(JSON.stringify({ id, ...decision })) as JsonValue },
    );
    return this.commands.run(command, async (tx) => {
      await this.requireActor(tx, request);
      const report = await this.photos.find(tx, id, true);
      if (!report) throw new DomainError('MEDIA_NOT_FOUND');
      const authority = await this.authorize(request, report, tx);
      if (report.status !== 'open' || report.reportVersion !== decision.expectedVersion
        || report.targetVersion !== decision.targetVersion)
        throw new DomainError('MEDIA_VERSION_CONFLICT');
      if (decision.action === 'remove' && report.moderationState === 'removed')
        throw new DomainError('VIDEO_INVALID_TRANSITION');
      const targetVersion = decision.action === 'remove'
        ? await this.photos.removeAsset(tx, { assetId: report.assetId, expectedVersion: decision.targetVersion })
        : report.targetVersion;
      if (targetVersion === null) throw new DomainError('MEDIA_VERSION_CONFLICT');
      const resolution = decision.action === 'dismiss' ? 'dismissed' : 'removed';
      const reportVersion = await this.photos.resolve(tx, {
        reportId: id, expectedVersion: decision.expectedVersion, resolution, resolvedAt: this.clock.now(),
      });
      if (reportVersion === null) throw new DomainError('MEDIA_VERSION_CONFLICT');
      const moderationState = decision.action === 'remove' ? 'removed' : report.moderationState;
      await this.record(tx, request, authority.isSuper, report, {
        action: `media.report.${decision.action}`, entityType: 'media_report', entityId: id,
        summary: `Media report ${decision.action}`, fields: ['status', 'resolution', 'version'],
        before: { status: report.status, resolution: report.resolution, version: report.reportVersion },
        after: { status: 'resolved', resolution, version: reportVersion },
      });
      if (decision.action === 'remove')
        await this.record(tx, request, authority.isSuper, report, {
          action: 'media.photo.remove_report', entityType: 'media_asset', entityId: report.assetId,
          summary: 'Photo removed after media report', fields: ['moderationState', 'version'],
          before: { moderationState: report.moderationState, version: report.targetVersion },
          after: { moderationState, version: targetVersion },
        });
      return parseResult({
        reportId: id, status: 'resolved', resolution, reportVersion,
        targetStatus: moderationState === 'removed' ? 'removed' : 'approved',
        targetVersion, targetKind: 'photo', photoModerationState: moderationState,
      });
    }, {
      store: (result) => result,
      replay: async (tx, stored) => {
        await this.requireActor(tx, request);
        const report = await this.photos.find(tx, id, false);
        if (!report) throw new DomainError('MEDIA_NOT_FOUND');
        await this.authorize(request, report, tx);
        return parseResult(stored);
      },
    }).then(parseResult);
  }

  private async requireActor(tx: TxContext, request: VideoModerationRequest) {
    const principal = await this.sessions.requirePrincipal(tx, request.session);
    if (principal.userId !== request.actorId) throw new DomainError('SESSION_EXPIRED');
  }

  private authorize(request: VideoModerationRequest, report: StoredPhotoReport, tx: TxContext) {
    return this.adminScope.authorize({
      actorUserId: request.actorId, module: 'reviews', action: 'edit',
      scopes: [ScopeRefSchema.parse({ cityId: report.cityId, areaId: report.areaId })],
    }, tx);
  }

  private record(tx: TxContext, request: VideoModerationRequest, isSuper: boolean, report: StoredPhotoReport, entry: {
    action: string; entityType: string; entityId: string; summary: string; fields: string[];
    before: Record<string, JsonValue>; after: Record<string, JsonValue>;
  }) {
    return this.audit.record(tx, {
      actor: { userId: request.actorId, role: isSuper ? 'super_admin' : 'admin', label: isSuper ? 'Super Admin' : 'Admin' },
      ...entry,
      cityId: report.cityId,
      areaId: report.areaId,
      relatedScopes: [ScopeRefSchema.parse({ cityId: report.cityId, areaId: report.areaId })],
      correlationId: request.correlationId,
    });
  }

  private photoDto(row: StoredPhotoReport) {
    const preview = row.publicImage
      ? publicImage(row.publicImage, { ...PREVIEW[row.placementType], placementId: row.placementId })
      : null;
    return PhotoReportQueueItemSchema.parse({
      queueItemType: 'report', reportId: row.reportId, targetKind: 'photo', assetId: row.assetId,
      placementType: row.placementType, placementId: row.placementId, reason: row.reason,
      details: row.details, status: 'open', reportVersion: row.reportVersion,
      targetVersion: row.targetVersion, createdAt: row.createdAt,
      allowedActions: row.moderationState === 'removed' ? ['dismiss'] : ['dismiss', 'remove'],
      photo: {
        assetId: row.assetId, placementType: row.placementType, placementId: row.placementId,
        businessId: row.businessId, businessNameEn: row.businessNameEn, businessNameHi: row.businessNameHi,
        moderationState: row.moderationState, preview,
      },
    });
  }
}
