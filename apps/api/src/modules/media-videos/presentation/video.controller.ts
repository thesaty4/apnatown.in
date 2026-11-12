import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateVideoReportSchema,
  CreateVideoSchema,
  VideoPageSchema,
  VideoReportAcceptedSchema,
  VideoFeedPageSchema,
  VideoFeedQuerySchema,
  VideoSchema,
  type CreateVideo,
  type CreateVideoReport,
  type VideoFeedQuery,
} from '@apnatown/shared';
import {
  BUSINESS_KIND_HEADER,
  BusinessKindSchema,
  type BusinessKind,
} from '@apnatown/shared/businesses';
import {
  EmptyRequestSchema,
  IdSchema,
  PageQuerySchema,
  type PageQuery,
} from '@apnatown/shared/wire';
import { createZodDto } from 'nestjs-zod';
import {
  OwnAccount,
  PublicRoute,
  SessionRoute,
  sessionBinding,
  type AuthRequest,
} from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { DomainError } from '../../../shared/errors/errors';
import { currentCorrelationId } from '../../../shared/logger/context';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors } from '../../admin/presentation/admin.dto';
import { VideoService } from '../application/video.service';
import type {
  VideoFeedRequest,
  VideoOwnerRequest,
  VideoReportRequest,
} from '../domain/videos';

class CreateVideoDto extends createZodDto(CreateVideoSchema) {}
class VideoDto extends createZodDto(VideoSchema) {}
class VideoPageDto extends createZodDto(VideoPageSchema) {}
class VideoPageQueryDto extends createZodDto(PageQuerySchema) {}
class VideoFeedQueryDto extends createZodDto(VideoFeedQuerySchema) {}
class VideoFeedPageDto extends createZodDto(VideoFeedPageSchema) {}
class CreateVideoReportDto extends createZodDto(CreateVideoReportSchema) {}
class VideoReportAcceptedDto extends createZodDto(VideoReportAcceptedSchema) {}

const READ_LIMIT = {
  key: 'media.videos.owner.read',
  maximumHits: 60,
  windowSeconds: 60,
  subject: 'principal',
} as const;

const WRITE_LIMIT = {
  key: 'media.videos.owner.create',
  maximumHits: 10,
  windowSeconds: 3600,
  subject: 'principal',
} as const;

function ownerRequest(request: AuthRequest): VideoOwnerRequest {
  if (!request.principal) throw new DomainError('SESSION_EXPIRED');
  const correlationId = currentCorrelationId();
  if (!correlationId) throw new Error('MISSING_CORRELATION_CONTEXT');
  const header = request.headers[BUSINESS_KIND_HEADER];
  let businessKind: BusinessKind | undefined;
  if (header !== undefined) {
    const parsed = BusinessKindSchema.safeParse(header);
    if (!parsed.success)
      throw new DomainError('VALIDATION_ERROR', { field: 'X-Business-Kind' });
    businessKind = parsed.data;
  }
  return {
    actorId: request.principal.userId,
    correlationId,
    key: request.headers['idempotency-key'],
    session: sessionBinding(request),
    ...(businessKind ? { businessKind } : {}),
  };
}

function reportRequest(request: AuthRequest): VideoReportRequest {
  const correlationId = currentCorrelationId();
  if (!correlationId) throw new Error('MISSING_CORRELATION_CONTEXT');
  return {
    reporterUserId: request.principal?.userId ?? null,
    correlationId,
    key: request.headers['idempotency-key'],
    session: sessionBinding(request),
  };
}

function feedRequest(request: AuthRequest): VideoFeedRequest {
  return {
    userId: request.principal?.userId ?? null,
    session: sessionBinding(request),
  };
}

@ApiTags('media')
@PrivateApi()
@OwnAccount()
@ApiHeader({
  name: 'X-Business-Kind',
  required: false,
  description: 'Selects which of the authenticated owner’s businesses is used; grants no access.',
  schema: { type: 'string', enum: ['shop', 'provider'] },
})
@Controller('businesses/me/videos')
export class OwnerVideoController {
  constructor(private readonly videos: VideoService) {}

  @Get()
  @ApiQuery({ type: VideoPageQueryDto })
  @ApiOperation({
    operationId: 'mediaOwnerVideoList',
    summary: 'List the authenticated business owner’s video links',
    description: 'Newest first; includes private moderation status and server-built playback descriptors. Response is private and no-store.',
  })
  @ApiOkResponse({ type: VideoPageDto })
  @AdminErrors({
    403: 'The caller does not own an approved vendor/provider business.',
    422: 'BUSINESS_CONTEXT_REQUIRED when the owner has both business kinds but omitted X-Business-Kind.',
  })
  @RateLimit(READ_LIMIT)
  async mine(
    @Req() request: AuthRequest,
    @Query(new InputPipe(PageQuerySchema)) query: PageQuery,
  ) {
    return VideoPageSchema.parse(await this.videos.mine(ownerRequest(request), query));
  }

  @Post()
  @BrowserMutation()
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Retry the identical submission with the same key for up to 24 hours.',
    schema: { type: 'string', minLength: 1, maxLength: 128, pattern: '^[A-Za-z0-9._:-]+$' },
  })
  @ApiBody({ type: CreateVideoDto })
  @ApiOperation({
    operationId: 'mediaOwnerVideoCreate',
    summary: 'Submit a YouTube or Instagram video link for moderation',
    description: 'Accepts link-only sources. The API stores only the validated provider, kind and ID; each submission starts pending and public access requires moderation approval.',
  })
  @ApiCreatedResponse({ type: VideoDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for invalid fields or COMMON_VALIDATION_FAILED for an invalid Idempotency-Key.',
    403: 'The caller does not own an approved vendor/provider business.',
    409: 'COMMON_CONFLICT when the idempotency key is reused with a different payload.',
    422: 'MEDIA_VIDEO_SOURCE_INVALID for a source outside the exact YouTube/Instagram allow-list.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
  })
  @RateLimit(WRITE_LIMIT)
  async create(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(CreateVideoSchema)) input: CreateVideo,
  ) {
    return VideoSchema.parse(await this.videos.create(ownerRequest(request), input));
  }
}

@ApiTags('media')
@Controller('videos')
export class PublicVideoController {
  constructor(private readonly videos: VideoService) {}

  @Get('feed')
  @SessionRoute()
  @ApiSecurity('sessionCookie')
  @ApiQuery({ type: VideoFeedQueryDto })
  @ApiOperation({
    operationId: 'mediaVideoFeed',
    summary: 'Read an immutable, session-bound Reels feed',
    description:
      'Ranks eligible videos once for 30 minutes. Supported filters are For You, Following, Nearby (2.5 km) and active business categories. Offer/product/service item filters await their owning read paths.',
  })
  @ApiOkResponse({ type: VideoFeedPageDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for malformed filters or mismatched cursors.',
    403: 'CSRF_INVALID for an untrusted browser session.',
    410: 'MEDIA_FEED_EXPIRED when the snapshot has expired or belongs to another session.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
  })
  @RateLimit(
    {
      key: 'media.videos.feed.session',
      maximumHits: 120,
      windowSeconds: 60,
      subject: 'session',
    },
    {
      key: 'media.videos.feed.ip',
      maximumHits: 240,
      windowSeconds: 60,
      subject: 'ip',
    },
  )
  async feed(
    @Req() request: AuthRequest,
    @Query(new InputPipe(VideoFeedQuerySchema)) query: VideoFeedQuery,
  ) {
    return VideoFeedPageSchema.parse(
      await this.videos.feed(feedRequest(request), query),
    );
  }

  @Get(':id')
  @HttpCode(200)
  @PublicRoute()
  @ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid' } })
  @ApiOperation({
    operationId: 'mediaPublicVideoGet',
    summary: 'Get an approved video by ID',
    description: 'Returns only currently approved videos with Reels consent and an approved business; playback URLs are rebuilt from validated provider IDs.',
  })
  @ApiOkResponse({ type: VideoDto })
  @AdminErrors({
    404: 'COMMON_VALIDATION_FAILED for an invalid id.',
    409: 'MEDIA_VIDEO_NOT_PUBLISHED when the video is pending, removed, or not Reels-consented.',
  })
  async get(
    @Param(new InputPipe(IdSchema)) id: string,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
  ) {
    return this.videos.publicVideo(id);
  }

  @Post(':id/reports')
  @HttpCode(202)
  @SessionRoute()
  @BrowserMutation()
  @ApiSecurity('sessionCookie')
  @ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid' } })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Retry the same report with the same key for 24 hours.',
    schema: {
      type: 'string',
      minLength: 1,
      maxLength: 128,
      pattern: '^[A-Za-z0-9._:-]+$',
    },
  })
  @ApiBody({ type: CreateVideoReportDto })
  @ApiOperation({
    operationId: 'mediaVideoReport',
    summary: 'Report a currently public video',
    description:
      'Accepts a reason and optional details from a guest or signed-in session. A report queues review and does not change video approval.',
  })
  @ApiAcceptedResponse({ type: VideoReportAcceptedDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for invalid fields or idempotency key.',
    403: 'CSRF_INVALID for a missing or untrusted browser session.',
    409: 'COMMON_CONFLICT when the key is reused with a different payload; MEDIA_VIDEO_NOT_PUBLISHED when the video is no longer public.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
  })
  @RateLimit(
    {
      key: 'media.video.report',
      maximumHits: 5,
      windowSeconds: 3600,
      subject: 'session',
    },
    {
      key: 'media.video.report.ip',
      maximumHits: 5,
      windowSeconds: 3600,
      subject: 'ip',
    },
  )
  async report(
    @Req() request: AuthRequest,
    @Param(new InputPipe(IdSchema)) id: string,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(CreateVideoReportSchema)) input: CreateVideoReport,
  ) {
    return VideoReportAcceptedSchema.parse(
      await this.videos.report(reportRequest(request), id, input),
    );
  }
}
