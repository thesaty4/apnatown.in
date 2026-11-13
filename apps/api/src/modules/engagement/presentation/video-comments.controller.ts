import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  VideoCommentAdminPageSchema,
  VideoCommentAdminQuerySchema,
  VideoCommentCreateSchema,
  VideoCommentDecisionResultSchema,
  VideoCommentDecisionSchema,
  VideoCommentPublicPageSchema,
  VideoCommentPublicQuerySchema,
  VideoCommentSchema,
  type VideoCommentAdminQuery,
  type VideoCommentCreate,
  type VideoCommentDecision,
} from '@apnatown/shared';
import { EmptyRequestSchema, IdSchema } from '@apnatown/shared/wire';
import { createZodDto } from 'nestjs-zod';
import {
  Permission,
  Roles,
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
import {
  VideoCommentsService,
} from '../application/video-comments.service';
import { VideoCommentModerationService } from '../application/video-comment-moderation.service';
import type { VideoCommentRequest } from '../domain/comments';

class VideoCommentCreateDto extends createZodDto(VideoCommentCreateSchema) {}
class VideoCommentDto extends createZodDto(VideoCommentSchema) {}
class VideoCommentPublicQueryDto extends createZodDto(
  VideoCommentPublicQuerySchema,
) {}
class VideoCommentPublicPageDto extends createZodDto(
  VideoCommentPublicPageSchema,
) {}
class VideoCommentAdminQueryDto extends createZodDto(
  VideoCommentAdminQuerySchema,
) {}
class VideoCommentAdminPageDto extends createZodDto(
  VideoCommentAdminPageSchema,
) {}
class VideoCommentDecisionDto extends createZodDto(
  VideoCommentDecisionSchema,
) {}
class VideoCommentDecisionResultDto extends createZodDto(
  VideoCommentDecisionResultSchema,
) {}

const CREATE_LIMIT = {
  key: 'engagement.video_comments.create',
  maximumHits: 5,
  windowSeconds: 60,
  subject: 'principal',
} as const;
const ADMIN_READ_LIMIT = {
  key: 'engagement.video_comments.admin.read',
  maximumHits: 60,
  windowSeconds: 60,
  subject: 'principal',
} as const;
const ADMIN_WRITE_LIMIT = {
  key: 'engagement.video_comments.admin.decision',
  maximumHits: 30,
  windowSeconds: 3600,
  subject: 'principal',
} as const;

function commentRequest(request: AuthRequest): VideoCommentRequest {
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

@ApiTags('engagement')
@PrivateApi()
@Controller('videos')
export class PublicVideoCommentsController {
  constructor(private readonly comments: VideoCommentsService) {}

  @Get(':videoId/comments')
  @SessionRoute()
  @ApiParam({ name: 'videoId', schema: { type: 'string', format: 'uuid' } })
  @ApiQuery({ type: VideoCommentPublicQueryDto })
  @ApiOperation({
    operationId: 'engagementVideoCommentsList',
    summary: 'List published comments and the caller’s own pending comments',
    description:
      'Available to anonymous and authenticated sessions. Comment text is plain JSON text; pending comments are visible only to their author.',
  })
  @ApiOkResponse({ type: VideoCommentPublicPageDto })
  async list(
    @Req() request: AuthRequest,
    @Param('videoId', new InputPipe(IdSchema)) videoId: string,
    @Query(new InputPipe(VideoCommentPublicQuerySchema))
    query: { cursor?: string; limit: number },
  ) {
    const result = await this.comments.publicPage(
      videoId,
      request.principal?.userId ?? null,
      query,
    );
    return VideoCommentPublicPageSchema.parse(result);
  }
}

@ApiTags('engagement')
@PrivateApi()
@Roles('customer')
@Controller('videos')
export class VideoCommentsController {
  constructor(private readonly comments: VideoCommentsService) {}

  @Post(':videoId/comments')
  @BrowserMutation()
  @RateLimit(CREATE_LIMIT)
  @ApiParam({ name: 'videoId', schema: { type: 'string', format: 'uuid' } })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Retry the identical comment command within 24 hours.',
    schema: {
      type: 'string',
      minLength: 1,
      maxLength: 128,
      pattern: '^[A-Za-z0-9._:-]+$',
    },
  })
  @ApiBody({ type: VideoCommentCreateDto })
  @ApiOperation({
    operationId: 'engagementVideoCommentCreate',
    summary: 'Create a video comment',
    description:
      'Clean comments publish immediately. Comments containing a URL or configured blocked word enter pending moderation.',
  })
  @ApiCreatedResponse({ type: VideoCommentDto })
  @AdminErrors({
    403: 'Only the authenticated customer may create a comment.',
    409: 'MEDIA_VIDEO_NOT_PUBLISHED when the video is not currently public.',
    429: 'COMMON_RATE_LIMITED with Retry-After (5 comments/minute/user).',
  })
  async create(
    @Req() request: AuthRequest,
    @Param('videoId', new InputPipe(IdSchema)) videoId: string,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(VideoCommentCreateSchema)) body: VideoCommentCreate,
  ) {
    return VideoCommentSchema.parse(
      await this.comments.create(commentRequest(request), videoId, body),
    );
  }

  @Delete(':videoId/comments/:id')
  @HttpCode(204)
  @BrowserMutation()
  @ApiParam({ name: 'videoId', schema: { type: 'string', format: 'uuid' } })
  @ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid' } })
  @ApiOperation({
    operationId: 'engagementVideoCommentDelete',
    summary: 'Remove the caller’s comment',
    description:
      'Only the author may remove a comment. Repeating the request is safe even if the video is no longer public.',
  })
  @ApiNoContentResponse()
  async remove(
    @Req() request: AuthRequest,
    @Param('videoId', new InputPipe(IdSchema)) videoId: string,
    @Param('id', new InputPipe(IdSchema)) id: string,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
  ): Promise<void> {
    await this.comments.removeByAuthor(commentRequest(request), videoId, id);
  }
}

@ApiTags('admin', 'engagement')
@PrivateApi()
@Roles('admin', 'super_admin')
@Controller('admin/comments')
export class AdminVideoCommentsController {
  constructor(private readonly comments: VideoCommentModerationService) {}

  @Get()
  @Permission('reviews', 'view')
  @RateLimit(ADMIN_READ_LIMIT)
  @ApiQuery({ type: VideoCommentAdminQueryDto })
  @ApiOperation({
    operationId: 'engagementAdminVideoCommentsList',
    summary: 'List video comments inside the current reviews scope',
    description:
      'Each status count and page row is filtered by current assigned city/area scope before aggregation.',
  })
  @ApiOkResponse({ type: VideoCommentAdminPageDto })
  @AdminErrors({
    403: 'ADMIN_SCOPE_FORBIDDEN when reviews:view is not granted.',
  })
  async list(
    @Req() request: AuthRequest,
    @Query(new InputPipe(VideoCommentAdminQuerySchema))
    query: VideoCommentAdminQuery,
  ) {
    return VideoCommentAdminPageSchema.parse(
      await this.comments.adminPage(commentRequest(request), query),
    );
  }

  @Post(':id/decision')
  @HttpCode(200)
  @Permission('reviews', 'edit')
  @BrowserMutation()
  @RateLimit(ADMIN_WRITE_LIMIT)
  @ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid' } })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Retry the identical moderation decision within 24 hours.',
    schema: {
      type: 'string',
      minLength: 1,
      maxLength: 128,
      pattern: '^[A-Za-z0-9._:-]+$',
    },
  })
  @ApiBody({ type: VideoCommentDecisionDto })
  @ApiOperation({
    operationId: 'engagementAdminVideoCommentDecision',
    summary: 'Publish or remove a video comment',
    description:
      'Rechecks reviews:edit and exact video business scope in the command transaction; writes the versioned decision, audit and event atomically.',
  })
  @ApiOkResponse({ type: VideoCommentDecisionResultDto })
  @AdminErrors({
    403: 'ADMIN_SCOPE_FORBIDDEN when the video business is outside assigned scope.',
    404: 'ENGAGEMENT_TARGET_NOT_FOUND when the comment no longer exists.',
    409: 'COMMENT_INVALID_TRANSITION or COMMENT_VERSION_CONFLICT.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
  })
  async decide(
    @Req() request: AuthRequest,
    @Param('id', new InputPipe(IdSchema)) id: string,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(VideoCommentDecisionSchema))
    body: VideoCommentDecision,
  ) {
    return VideoCommentDecisionResultSchema.parse(
      await this.comments.decide(commentRequest(request), id, body),
    );
  }
}
