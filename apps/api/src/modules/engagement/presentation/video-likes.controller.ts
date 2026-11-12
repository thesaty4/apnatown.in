import { Body, Controller, Delete, Get, Param, Put, Query, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  EngagementStateQuerySchema,
  EngagementStateSchema,
  VideoLikeResultSchema,
  type EngagementStateQuery,
} from '@apnatown/shared';
import { EmptyRequestSchema, IdSchema } from '@apnatown/shared/wire';
import { createZodDto } from 'nestjs-zod';
import { Roles, SessionRoute, sessionBinding, type AuthRequest } from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { currentCorrelationId } from '../../../shared/logger/context';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { VideoLikesService } from '../application/video-likes.service';
import type { VideoLikeRequest } from '../domain/likes';

class VideoLikeResultDto extends createZodDto(VideoLikeResultSchema) {}
class EngagementStateQueryDto extends createZodDto(EngagementStateQuerySchema) {}
class EngagementStateDto extends createZodDto(EngagementStateSchema) {}

function likeRequest(request: AuthRequest): VideoLikeRequest {
  const correlationId = currentCorrelationId();
  if (!correlationId) throw new Error('MISSING_CORRELATION_CONTEXT');
  return { session: sessionBinding(request), correlationId };
}

@ApiTags('engagement')
@PrivateApi()
@Controller('engagement')
export class VideoLikesController {
  constructor(private readonly likes: VideoLikesService) {}

  @Get('me/state')
  @SessionRoute()
  @ApiQuery({ type: EngagementStateQueryDto })
  @ApiOperation({
    operationId: 'engagementState',
    summary: 'Read own liked-video IDs and public counts in one bounded batch',
    description: 'Guests receive empty likedVideoIds. Counts omit unavailable videos.',
  })
  @ApiOkResponse({ type: EngagementStateDto })
  async state(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EngagementStateQuerySchema)) query: EngagementStateQuery,
  ) {
    return EngagementStateSchema.parse(await this.likes.state(
      request.principal ? sessionBinding(request) : null,
      query,
    ));
  }

  @Put('likes/:videoId')
  @Roles('customer')
  @BrowserMutation()
  @RateLimit({ key: 'engagement.likes.write', maximumHits: 60, windowSeconds: 60, subject: 'principal' })
  @ApiParam({ name: 'videoId', schema: { type: 'string', format: 'uuid' } })
  @ApiOperation({
    operationId: 'engagementVideoLike',
    summary: 'Like a public video; repeated requests do not increment the count',
  })
  @ApiOkResponse({ type: VideoLikeResultDto })
  async like(
    @Req() request: AuthRequest,
    @Param('videoId', new InputPipe(IdSchema)) videoId: string,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(EmptyRequestSchema.default({}))) _body: Record<string, never>,
  ) {
    return VideoLikeResultSchema.parse(await this.likes.set(likeRequest(request), videoId, true));
  }

  @Delete('likes/:videoId')
  @Roles('customer')
  @BrowserMutation()
  @RateLimit({ key: 'engagement.likes.write', maximumHits: 60, windowSeconds: 60, subject: 'principal' })
  @ApiParam({ name: 'videoId', schema: { type: 'string', format: 'uuid' } })
  @ApiOperation({
    operationId: 'engagementVideoUnlike',
    summary: 'Remove own like, including when the video is no longer public',
  })
  @ApiOkResponse({ type: VideoLikeResultDto })
  async unlike(
    @Req() request: AuthRequest,
    @Param('videoId', new InputPipe(IdSchema)) videoId: string,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(EmptyRequestSchema.default({}))) _body: Record<string, never>,
  ) {
    return VideoLikeResultSchema.parse(await this.likes.set(likeRequest(request), videoId, false));
  }
}
