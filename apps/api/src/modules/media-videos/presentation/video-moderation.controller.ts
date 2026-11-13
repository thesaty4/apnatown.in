import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  AdminMediaReportPageSchema,
  AdminMediaReportsQuerySchema,
  type AdminMediaReportsQuery,
  MediaReportDecisionResultSchema,
  MediaReportDecisionSchema,
  VideoModerationDecisionSchema,
  VideoModerationItemSchema,
  VideoModerationPageSchema,
  VideoModerationQuerySchema,
  type MediaReportDecision,
  type VideoModerationDecision,
  type VideoModerationQuery,
} from '@apnatown/shared';
import { EmptyRequestSchema, IdSchema } from '@apnatown/shared/wire';
import { createZodDto } from 'nestjs-zod';
import {
  Permission,
  Roles,
  sessionBinding,
  type AuthRequest,
} from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { DomainError } from '../../../shared/errors/errors';
import { currentCorrelationId } from '../../../shared/logger/context';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors } from '../../admin/presentation/admin.dto';
import { VideoModerationService } from '../application/video-moderation.service';
import { MediaReportModerationService } from '../application/media-report-moderation.service';
import type { VideoModerationRequest } from '../domain/videos';

class VideoModerationQueryDto extends createZodDto(VideoModerationQuerySchema) {}
class VideoModerationPageDto extends createZodDto(VideoModerationPageSchema) {}
class VideoModerationDecisionDto extends createZodDto(
  VideoModerationDecisionSchema,
) {}
class VideoModerationItemDto extends createZodDto(VideoModerationItemSchema) {}
class MediaReportDecisionDto extends createZodDto(
  MediaReportDecisionSchema,
) {}
class MediaReportDecisionResultDto extends createZodDto(
  MediaReportDecisionResultSchema,
) {}
class AdminMediaReportsQueryDto extends createZodDto(AdminMediaReportsQuerySchema) {}
class AdminMediaReportPageDto extends createZodDto(AdminMediaReportPageSchema) {}

const READ_LIMIT = {
  key: 'media.videos.admin.read',
  maximumHits: 60,
  windowSeconds: 60,
  subject: 'principal',
} as const;
const WRITE_LIMIT = {
  key: 'media.videos.admin.decision',
  maximumHits: 30,
  windowSeconds: 3600,
  subject: 'principal',
} as const;

function moderationRequest(request: AuthRequest): VideoModerationRequest {
  if (!request.principal) throw new DomainError('SESSION_EXPIRED');
  const correlationId = currentCorrelationId();
  if (!correlationId) throw new Error('MISSING_CORRELATION_CONTEXT');
  return {
    actorId: request.principal.userId,
    correlationId,
    key: request.headers['idempotency-key'],
    session: sessionBinding(request),
  };
}

@ApiTags('admin', 'media')
@PrivateApi()
@Roles('admin', 'super_admin')
@Controller('admin/videos')
export class VideoModerationController {
  constructor(private readonly moderation: VideoModerationService) {}

  @Get()
  @Permission('reviews', 'view')
  @ApiQuery({ type: VideoModerationQueryDto })
  @ApiOperation({
    operationId: 'mediaAdminVideoList',
    summary: 'List videos within the authenticated admin’s review scope',
    description:
      'Video status queues, open video reports and counts are filtered by current assigned city/area scope.',
  })
  @ApiOkResponse({ type: VideoModerationPageDto })
  @AdminErrors({
    403: 'ADMIN_SCOPE_FORBIDDEN when the admin lacks reviews:view or assigned scope.',
  })
  @RateLimit(READ_LIMIT)
  async list(
    @Req() request: AuthRequest,
    @Query(new InputPipe(VideoModerationQuerySchema))
    query: VideoModerationQuery,
  ) {
    return VideoModerationPageSchema.parse(
      await this.moderation.list(moderationRequest(request), query),
    );
  }

  @Post(':id/decision')
  @Permission('reviews', 'edit')
  @BrowserMutation()
  @ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid' } })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Retry the same video decision with the same key for 24 hours.',
    schema: {
      type: 'string',
      minLength: 1,
      maxLength: 128,
      pattern: '^[A-Za-z0-9._:-]+$',
    },
  })
  @ApiBody({ type: VideoModerationDecisionDto })
  @ApiOperation({
    operationId: 'mediaAdminVideoDecision',
    summary: 'Approve, reject or remove a video',
    description:
      'Rechecks reviews:edit and the stored video business scope in the command transaction; writes a versioned decision and audit entry atomically.',
  })
  @ApiOkResponse({ type: VideoModerationItemDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for invalid fields or key.',
    403: 'ADMIN_SCOPE_FORBIDDEN when the target business is outside assigned scope.',
    404: 'MEDIA_NOT_FOUND when the video does not exist.',
    409: 'MEDIA_VERSION_CONFLICT or VIDEO_INVALID_TRANSITION.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
  })
  @RateLimit(WRITE_LIMIT)
  async decide(
    @Req() request: AuthRequest,
    @Param('id', new InputPipe(IdSchema)) id: string,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(VideoModerationDecisionSchema))
    body: VideoModerationDecision,
  ) {
    return VideoModerationItemSchema.parse(
      await this.moderation.decide(moderationRequest(request), id, body),
    );
  }
}

@ApiTags('admin', 'media')
@PrivateApi()
@Roles('admin', 'super_admin')
@Controller('admin/media-reports')
export class AdminMediaReportController {
  constructor(
    private readonly moderation: VideoModerationService,
    private readonly reports: MediaReportModerationService,
  ) {}

  @Get()
  @Permission('reviews', 'view')
  @ApiQuery({ type: AdminMediaReportsQueryDto })
  @ApiOperation({
    operationId: 'mediaAdminReportList',
    summary: 'List open video and photo reports within the admin’s review scope',
    description:
      'One keyset queue (newest first) discriminated by targetKind (video|photo), filtered by current assigned city/area scope of the reported business. Photo items carry placementType/placementId/assetId and a placement-bound same-origin gateway preview while the placement is public (null otherwise); never a provider URL.',
  })
  @ApiOkResponse({ type: AdminMediaReportPageDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for invalid query or a malformed/foreign cursor.',
    403: 'ADMIN_SCOPE_FORBIDDEN when the admin lacks reviews:view or assigned scope.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
  })
  @RateLimit(READ_LIMIT)
  async list(
    @Req() request: AuthRequest,
    @Query(new InputPipe(AdminMediaReportsQuerySchema)) query: AdminMediaReportsQuery,
  ) {
    return AdminMediaReportPageSchema.parse(
      await this.reports.queue(moderationRequest(request), query),
    );
  }

  @Post(':id/decision')
  @Permission('reviews', 'edit')
  @BrowserMutation()
  @ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid' } })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Retry the same report decision with the same key for 24 hours.',
    schema: {
      type: 'string',
      minLength: 1,
      maxLength: 128,
      pattern: '^[A-Za-z0-9._:-]+$',
    },
  })
  @ApiBody({ type: MediaReportDecisionDto })
  @ApiOperation({
    operationId: 'mediaAdminReportDecision',
    summary: 'Dismiss a report or remove its video or photo target',
    description:
      'Rechecks reviews:edit and the stored business scope in the command transaction (also on idempotent replay) and audits atomically. Resolving a report never approves its target. Photo reports: targetVersion is the media asset version; remove marks the asset removed so no public placement or gateway serves it; result targetKind=photo with photoModerationState.',
  })
  @ApiOkResponse({ type: MediaReportDecisionResultDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for invalid fields or key.',
    403: 'ADMIN_SCOPE_FORBIDDEN when the target business is outside assigned scope.',
    404: 'MEDIA_NOT_FOUND when the report or target does not exist.',
    409: 'MEDIA_VERSION_CONFLICT or VIDEO_INVALID_TRANSITION.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
  })
  @RateLimit(WRITE_LIMIT)
  async decide(
    @Req() request: AuthRequest,
    @Param('id', new InputPipe(IdSchema)) id: string,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(MediaReportDecisionSchema))
    body: MediaReportDecision,
  ) {
    const actor = moderationRequest(request);
    return MediaReportDecisionResultSchema.parse(
      (await this.reports.isPhotoReport(id))
        ? await this.reports.resolvePhoto(actor, id, body)
        : await this.moderation.resolveReport(actor, id, body),
    );
  }
}
