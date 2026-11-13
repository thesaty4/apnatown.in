import { timingSafeEqual } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  CreateVideoReportSchema,
  CreateVideoSchema,
  VideoReportAcceptedSchema,
  VideoPageSchema,
  VideoSchema,
  VideoFeedItemSchema,
  VideoFeedLinkSchema,
  VideoFeedPageSchema,
  VideoFeedQuerySchema,
  type VideoFeedPill,
  type CreateVideo,
  type CreateVideoReport,
  type VideoFeedPage,
  type VideoFeedQuery,
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
import { parseVideoSource } from '../domain/video-source';
import { toVideoDto } from './media-dto';
import {
  VIDEO_REPOSITORY,
  type StoredVideo,
  type VideoOwnerRequest,
  type VideoPosition,
  type VideoReportRequest,
  type VideoFeedRequest,
  type VideoFeedRecord,
  type ReelRankSnapshot,
  type VideoRepository,
} from '../domain/videos';

const positionSchema = z.tuple([TimestampSchema, IdSchema]);
const VideoFeedLinksSchema = z.array(VideoFeedLinkSchema).max(5);
const feedPositionSchema = z.tuple([z.number().int().nonnegative(), IdSchema]);
const RECEIPT_TTL_MS = 24 * 60 * 60 * 1000;
const FEED_SNAPSHOT_TTL_MS = 30 * 60 * 1000;

interface FeedStart {
  snapshot: ReelRankSnapshot;
  effectiveFilter: VideoFeedPill;
  afterOrdinal: number;
}

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

  feed(request: VideoFeedRequest, input: VideoFeedQuery): Promise<VideoFeedPage> {
    const query = VideoFeedQuerySchema.parse(input);
    const subjectHash = rateLimitSubjectHash(
      this.config.CURSOR_SIGNING_KEY,
      `session:${request.session.id}`,
    );
    return this.uow.run(async (tx) => {
      let snapshot = query.snapshotId
        ? await this.videos.findRankSnapshot(tx, query.snapshotId)
        : await this.createFeedSnapshot(tx, subjectHash);
      if (!snapshot || !this.ownsSnapshot(snapshot, subjectHash))
        throw new DomainError('MEDIA_FEED_EXPIRED');
      if (snapshot.expiresAt.getTime() <= this.clock.now().getTime())
        throw new DomainError('MEDIA_FEED_EXPIRED');

      const start = await this.feedStart(
        tx,
        request,
        query,
        snapshot,
        subjectHash,
      );
      snapshot = start.snapshot;
      const binding: CursorBinding = {
        operation: 'media.videos.feed',
        sort: 'frozen-ordinal-asc',
        filters: {
          pill: start.effectiveFilter,
          category:
            start.effectiveFilter === 'category' ? query.category ?? null : null,
          lat: start.effectiveFilter === 'nearby' ? query.lat ?? null : null,
          lng: start.effectiveFilter === 'nearby' ? query.lng ?? null : null,
        },
        scope: {
          snapshotId: snapshot.id,
          subjectHash: Buffer.from(subjectHash).toString('hex'),
          expiresAt: snapshot.expiresAt.toISOString(),
        },
      };
      const afterOrdinal = query.cursor
        ? this.feedPosition(query.cursor, binding, snapshot.id)
        : start.afterOrdinal;
      const rows = await this.videos.feedPage(tx, {
        snapshotId: snapshot.id,
        afterOrdinal,
        limit: query.limit,
        ...this.feedFilter(query, start.effectiveFilter),
        userId: request.userId,
      });
      const visibleRows = rows.slice(0, query.limit);
      const last = visibleRows.at(-1);
      return VideoFeedPageSchema.parse({
        snapshotId: snapshot.id,
        expiresAt: snapshot.expiresAt.toISOString(),
        effectiveFilter: start.effectiveFilter,
        items: visibleRows.map((row) => this.feedDto(row)),
        nextCursor:
          rows.length > query.limit && last
            ? this.cursors.encode(binding, [last.ordinal, snapshot.id])
            : null,
      });
    });
  }

  private async feedStart(
    tx: TxContext,
    request: VideoFeedRequest,
    query: VideoFeedQuery,
    initialSnapshot: ReelRankSnapshot,
    subjectHash: Uint8Array,
  ): Promise<FeedStart> {
    if (!query.startVideoId)
      return {
        snapshot: initialSnapshot,
        effectiveFilter: query.pill,
        afterOrdinal: 0,
      };
    if (!(await this.videos.findPublic(tx, query.startVideoId)))
      throw new DomainError('MEDIA_VIDEO_NOT_PUBLISHED');

    let snapshot = initialSnapshot;
    let effectiveFilter = query.pill;
    let anchor = snapshot.rankedItems.find(
      (entry) => entry.videoId === query.startVideoId,
    );
    if (!anchor && query.snapshotId) {
      snapshot = await this.createFeedSnapshot(tx, subjectHash);
      anchor = snapshot.rankedItems.find(
        (entry) => entry.videoId === query.startVideoId,
      );
      effectiveFilter = 'for_you';
    }
    if (!anchor) throw new DomainError('MEDIA_VIDEO_NOT_PUBLISHED');

    if (
      effectiveFilter !== 'for_you' &&
      !(await this.anchorMatchesFilter(
        tx,
        request,
        query,
        snapshot.id,
        anchor.ordinal,
      ))
    ) {
      effectiveFilter = 'for_you';
      if (query.snapshotId && snapshot.id === query.snapshotId) {
        snapshot = await this.createFeedSnapshot(tx, subjectHash);
        anchor = snapshot.rankedItems.find(
          (entry) => entry.videoId === query.startVideoId,
        );
      }
    }
    if (!anchor) throw new DomainError('MEDIA_VIDEO_NOT_PUBLISHED');
    return {
      snapshot,
      effectiveFilter,
      afterOrdinal: anchor.ordinal - 1,
    };
  }

  private anchorMatchesFilter(
    tx: TxContext,
    request: VideoFeedRequest,
    query: VideoFeedQuery,
    snapshotId: string,
    anchorOrdinal: number,
  ): Promise<boolean> {
    return this.videos
      .feedPage(tx, {
        snapshotId,
        afterOrdinal: anchorOrdinal - 1,
        limit: 1,
        ...this.feedFilter(query, query.pill),
        userId: request.userId,
      })
      .then((rows) => rows[0]?.id === query.startVideoId);
  }

  private feedFilter(query: VideoFeedQuery, pill: VideoFeedPill) {
    return {
      pill,
      ...(pill === 'category' && query.category
        ? { category: query.category }
        : {}),
      ...(pill === 'nearby' && query.lat !== undefined && query.lng !== undefined
        ? { lat: query.lat, lng: query.lng }
        : {}),
    };
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

  private async createFeedSnapshot(
    tx: TxContext,
    sessionSubjectHash: Uint8Array,
  ): Promise<ReelRankSnapshot> {
    const createdAt = this.clock.now();
    const snapshot: ReelRankSnapshot = {
      id: this.ids.uuidv7(),
      sessionSubjectHash,
      rankedItems: await this.videos.rankCandidates(tx),
      createdAt,
      expiresAt: new Date(createdAt.getTime() + FEED_SNAPSHOT_TTL_MS),
    };
    await this.videos.insertRankSnapshot(tx, snapshot);
    return snapshot;
  }

  private ownsSnapshot(
    snapshot: ReelRankSnapshot,
    sessionSubjectHash: Uint8Array,
  ): boolean {
    const stored = Buffer.from(snapshot.sessionSubjectHash);
    const expected = Buffer.from(sessionSubjectHash);
    return stored.length === expected.length && timingSafeEqual(stored, expected);
  }

  private feedPosition(
    cursor: string,
    binding: CursorBinding,
    snapshotId: string,
  ): number {
    const parsed = feedPositionSchema.safeParse(this.cursors.decode(cursor, binding));
    if (!parsed.success || parsed.data[1] !== snapshotId)
      throw new DomainError('VALIDATION_ERROR', { field: 'cursor' });
    return parsed.data[0];
  }

  private feedDto(row: VideoFeedRecord) {
    const count = (value: string) => {
      const parsed = Number(value);
      if (!Number.isSafeInteger(parsed) || parsed < 0)
        throw new DomainError('COMMON_INTERNAL_ERROR');
      return parsed;
    };
    return VideoFeedItemSchema.parse({
      ...this.dto(row),
      businessNameEn: row.businessNameEn,
      businessNameHi: row.businessNameHi,
      verified: row.verified,
      distanceKm: row.distanceKm,
      isOpen: row.isOpen,
      viewCount: count(row.viewCount),
      likeCount: count(row.likeCount),
      commentCount: count(row.commentCount),
      shareCount: count(row.shareCount),
      links: VideoFeedLinksSchema.parse(row.links),
    });
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
    return toVideoDto(row);
  }
}
