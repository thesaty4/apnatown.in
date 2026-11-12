import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  CreateVideoReportSchema,
  CreateVideoSchema,
  SafeVideoPlaybackSchema,
  VideoReportAcceptedSchema,
  VideoPageSchema,
  VideoSchema,
  VideoSourceSchema,
  type CreateVideo,
  type CreateVideoReport,
  type VideoReportAccepted,
  type Video,
} from '@apnatown/shared';
import { IdSchema, TimestampSchema, type PageQuery } from '@apnatown/shared/wire';
import { z } from 'zod';
import { SESSION_ACCESS, type SessionAccess } from '../../../shared/auth/ports';
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
import { RUNTIME_CONFIG, type RuntimeConfig } from '../../../shared/config/config';
import { rateLimitSubjectHash } from '../../../shared/rate-limit/rate-limit';
import { CLOCK, ID_PROVIDER, type Clock, type IdProvider } from '../../../shared/runtime/providers';
import { BusinessOwnerContext } from '../../businesses/application/business-owner-context';
import { parseVideoSource, videoPlayback } from '../domain/video-source';
import {
  VIDEO_REPOSITORY,
  type StoredVideo,
  type VideoOwnerRequest,
  type VideoPosition,
  type VideoReportRequest,
  type VideoRepository,
} from '../domain/videos';

const positionSchema = z.tuple([TimestampSchema, IdSchema]);
const RECEIPT_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class VideoService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY)
    private readonly contexts: HttpCommandContextFactory,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    private readonly owners: BusinessOwnerContext,
    @Inject(VIDEO_REPOSITORY) private readonly videos: VideoRepository,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
  ) {}

  create(request: VideoOwnerRequest, input: CreateVideo): Promise<Video> {
    const body = CreateVideoSchema.parse(input);
    const source = parseVideoSource(body.source.url);
    if (source.provider !== body.source.kind)
      throw new DomainError('MEDIA_VIDEO_SOURCE_INVALID', { field: 'source' });
    const payload = {
      source,
      caption: body.caption,
      hashtags: body.hashtags,
      showInGallery: body.showInGallery,
      showInReels: body.showInReels,
      businessKind: request.businessKind ?? null,
    };
    const command = this.contexts.create(
      { name: 'media.video.create', method: 'POST', scope: 'principal', successStatus: 201 },
      {
        actorId: request.actorId,
        correlationId: request.correlationId,
        resource: '/businesses/me/videos',
        business: null,
        expiresAt: new Date(this.clock.now().getTime() + RECEIPT_TTL_MS),
      },
      {
        key: request.key,
        payload: JSON.parse(JSON.stringify(payload)) as JsonValue,
      },
    );
    const policy: IdempotencyResultPolicy<Video & JsonValue> = {
      store: (result) => result,
      replay: async (tx, stored) => {
        await this.owner(tx, request);
        return VideoSchema.parse(stored) as Video & JsonValue;
      },
    };
    return this.commands.run(
      command,
      async (tx) => {
        const business = await this.owner(tx, request);
        const now = this.clock.now();
        const row: StoredVideo = {
          id: this.ids.uuidv7(),
          businessId: business.id,
          provider: source.provider,
          kind: source.kind,
          providerId: source.providerId,
          caption: body.caption,
          hashtags: body.hashtags,
          showInGallery: body.showInGallery,
          showInReels: body.showInReels,
          status: 'pending',
          version: 1,
          createdAt: now.toISOString(),
        };
        await this.videos.insert(tx, row);
        return this.dto(row) as Video & JsonValue;
      },
      policy,
    ).then((value) => VideoSchema.parse(value));
  }

  mine(request: VideoOwnerRequest, query: PageQuery) {
    return this.uow.run(async (tx) => {
      const business = await this.owner(tx, request);
      const binding: CursorBinding = {
        operation: 'media.videos.mine',
        sort: 'createdAt-id-desc',
        filters: null,
        scope: {
          actor: request.actorId,
          businessId: business.id,
          businessKind: business.kind,
        },
      };
      const after = this.position(query.cursor, binding);
      const rows = await this.videos.mine(tx, {
        businessId: business.id,
        limit: query.limit,
        ...(after ? { after } : {}),
      });
      const items = rows.slice(0, query.limit).map((row) => this.dto(row));
      const last = items.at(-1);
      return VideoPageSchema.parse({
        items,
        nextCursor:
          rows.length > query.limit && last
            ? this.cursors.encode(binding, [last.createdAt, last.id])
            : null,
      });
    });
  }

  publicVideo(id: string): Promise<Video> {
    return this.uow.run(async (tx) => {
      const row = await this.videos.findPublic(tx, id);
      if (!row) throw new DomainError('MEDIA_VIDEO_NOT_PUBLISHED');
      return VideoSchema.parse(this.dto(row));
    });
  }

  report(
    request: VideoReportRequest,
    videoId: string,
    input: CreateVideoReport,
  ): Promise<VideoReportAccepted> {
    const body = CreateVideoReportSchema.parse(input);
    const reporterSubjectHash = rateLimitSubjectHash(
      this.config.CURSOR_SIGNING_KEY,
      `session:${request.session.id}`,
    );
    const payload = {
      videoId,
      ...body,
      reporterUserId: request.reporterUserId,
      reporterSubjectHash: reporterSubjectHash.toString('hex'),
    };
    const command = this.contexts.create(
      {
        name: 'media.video.report',
        method: 'POST',
        scope: 'principal',
        successStatus: 202,
      },
      {
        actorId: request.session.id,
        correlationId: request.correlationId,
        resource: `/videos/${videoId}/reports`,
        business: null,
        expiresAt: new Date(this.clock.now().getTime() + RECEIPT_TTL_MS),
      },
      {
        key: request.key,
        payload: JSON.parse(JSON.stringify(payload)) as JsonValue,
      },
    );
    const policy: IdempotencyResultPolicy<VideoReportAccepted & JsonValue> = {
      store: (result) => result,
      replay: (_tx, stored) =>
        Promise.resolve(
          VideoReportAcceptedSchema.parse(stored) as VideoReportAccepted &
            JsonValue,
        ),
    };
    return this.commands
      .run(
        command,
        async (tx) => {
          const video = await this.videos.findPublic(tx, videoId);
          if (!video) throw new DomainError('MEDIA_VIDEO_NOT_PUBLISHED');
          const reportId = await this.videos.insertVideoReport(tx, {
            id: this.ids.uuidv7(),
            videoId,
            businessId: video.businessId,
            reporterUserId: request.reporterUserId,
            reporterSubjectHash,
            reason: body.reason,
            details: body.details ?? null,
            createdAt: this.clock.now(),
          });
          return VideoReportAcceptedSchema.parse({
            reportId,
          }) as VideoReportAccepted & JsonValue;
        },
        policy,
      )
      .then((result) => VideoReportAcceptedSchema.parse(result));
  }

  private async owner(tx: TxContext, request: VideoOwnerRequest) {
    const principal = await this.sessions.requirePrincipal(tx, request.session);
    if (principal.userId !== request.actorId)
      throw new DomainError('SESSION_EXPIRED');
    const business = await this.owners.resolve(tx, {
      userId: principal.userId,
      ...(request.businessKind ? { kind: request.businessKind } : {}),
    });
    if (
      business.status !== 'approved' ||
      !(await this.owners.sellerRole(tx, business))
    )
      throw new DomainError('USERS_APPROVAL_REQUIRED');
    return business;
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

  private dto(row: StoredVideo): Video {
    return VideoSchema.parse({
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
        videoPlayback(VideoSourceSchema.parse({
          provider: row.provider,
          kind: row.kind,
          providerId: row.providerId,
        })),
      ),
    });
  }
}
