import {
  Body,
  Controller,
  HttpCode,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  VideoShareCreateSchema,
  type VideoShareCreate,
} from '@apnatown/shared';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { createZodDto } from 'nestjs-zod';
import {
  SessionRoute,
  sessionBinding,
  type AuthRequest,
} from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { currentCorrelationId } from '../../../shared/logger/context';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { VideoSharesService } from '../application/video-shares.service';
import type { VideoShareRequest } from '../domain/shares';

class VideoShareCreateDto extends createZodDto(VideoShareCreateSchema) {}

function shareRequest(request: AuthRequest): VideoShareRequest {
  const session = sessionBinding(request);
  const correlationId = currentCorrelationId();
  if (!correlationId) throw new Error('MISSING_CORRELATION_CONTEXT');
  return {
    actorId: request.principal?.userId ?? session.id,
    correlationId,
    key: request.headers['idempotency-key'],
  };
}

@ApiTags('engagement')
@PrivateApi()
@Controller('engagement/shares')
export class VideoSharesController {
  constructor(private readonly shares: VideoSharesService) {}

  @Post()
  @HttpCode(204)
  @SessionRoute()
  @BrowserMutation()
  @RateLimit({
    key: 'engagement.shares.create',
    maximumHits: 30,
    windowSeconds: 60,
    subject: 'session',
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Retry the same share action within 24 hours.',
    schema: {
      type: 'string',
      minLength: 1,
      maxLength: 128,
      pattern: '^[A-Za-z0-9._:-]+$',
    },
  })
  @ApiBody({ type: VideoShareCreateDto })
  @ApiOperation({
    operationId: 'engagementVideoShare',
    summary: 'Record a share of a currently public video',
    description:
      'Accepts a target ID rather than a URL. The server validates current visibility and commits its count and event atomically.',
  })
  @ApiNoContentResponse()
  async create(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(VideoShareCreateSchema)) body: VideoShareCreate,
  ): Promise<void> {
    await this.shares.create(shareRequest(request), body);
  }
}
