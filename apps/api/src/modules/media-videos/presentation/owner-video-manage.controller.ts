import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Put, Query, Req } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  ExpectedVersionBodySchema,
  MediaItemParamsSchema,
  MediaOrderSchema,
  OwnerVideoDetailSchema,
  UpdateMediaOrderSchema,
  VideoEditSchema,
  type ExpectedVersionBody,
  type MediaItemParams,
  type UpdateMediaOrder,
  type VideoEdit,
} from '@apnatown/shared';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { createZodDto } from 'nestjs-zod';
import type { AuthRequest } from '../../../shared/auth';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors } from '../../admin/presentation/admin.dto';
import { MediaOrderService } from '../application/media-order.service';
import { OwnerVideoService } from '../application/owner-video.service';
import {
  IdempotentMutation,
  MediaOwnerApi,
  OWNER_ERRORS,
  OWNER_READ_LIMIT,
  OWNER_WRITE_LIMIT,
} from './media-owner.decorators';
import { ownerRequest } from './video.controller';

export class VideoEditDto extends createZodDto(VideoEditSchema) {}
export class ExpectedVersionBodyDto extends createZodDto(ExpectedVersionBodySchema) {}
export class OwnerVideoDetailDto extends createZodDto(OwnerVideoDetailSchema) {}
export class MediaOrderDto extends createZodDto(MediaOrderSchema) {}
export class UpdateMediaOrderDto extends createZodDto(UpdateMediaOrderSchema) {}

const ID_PARAM = { name: 'id', schema: { type: 'string', format: 'uuid' } } as const;

/** Owner Videos manager: order, detail, edit and owner delete of video links. */
@ApiTags('media')
@MediaOwnerApi()
@Controller('businesses/me/videos')
export class OwnerVideoManageController {
  constructor(
    private readonly videos: OwnerVideoService,
    private readonly order: MediaOrderService,
  ) {}

  @Get('order')
  @ApiOperation({
    operationId: 'mediaOwnerVideoOrderGet',
    summary: 'Read the owner Videos manager order',
    description: 'Every non-owner-deleted video of the business in manual display order, with the list order version.',
  })
  @ApiOkResponse({ type: MediaOrderDto })
  @AdminErrors(OWNER_ERRORS)
  @RateLimit(OWNER_READ_LIMIT)
  async getOrder(@Req() request: AuthRequest, @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>) {
    return MediaOrderSchema.parse(await this.order.get(ownerRequest(request), 'videos'));
  }

  @Put('order')
  @IdempotentMutation()
  @ApiBody({ type: UpdateMediaOrderDto })
  @ApiOperation({
    operationId: 'mediaOwnerVideoOrderPut',
    summary: 'Replace the owner Videos manager order',
    description: 'All-or-nothing: orderedIds must be exactly the current list membership without duplicates and expectedOrderVersion must match.',
  })
  @ApiOkResponse({ type: MediaOrderDto })
  @AdminErrors({ ...OWNER_ERRORS, 422: 'MEDIA_LINK_TARGET_INVALID when orderedIds differs from the current list membership.' })
  @RateLimit(OWNER_WRITE_LIMIT)
  async putOrder(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(UpdateMediaOrderSchema)) input: UpdateMediaOrder,
  ) {
    return MediaOrderSchema.parse(await this.order.put(ownerRequest(request), 'videos', input));
  }

  @Get(':id')
  @ApiParam(ID_PARAM)
  @ApiOperation({
    operationId: 'mediaOwnerVideoGet',
    summary: 'Read one own video with moderation state, thumbnail and links',
  })
  @ApiOkResponse({ type: OwnerVideoDetailDto })
  @AdminErrors(OWNER_ERRORS)
  @RateLimit(OWNER_READ_LIMIT)
  async get(
    @Req() request: AuthRequest,
    @Param(new InputPipe(MediaItemParamsSchema)) params: MediaItemParams,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
  ) {
    return OwnerVideoDetailSchema.parse(await this.videos.get(ownerRequest(request), params.id));
  }

  @Patch(':id')
  @IdempotentMutation()
  @ApiParam(ID_PARAM)
  @ApiBody({ type: VideoEditDto })
  @ApiOperation({
    operationId: 'mediaOwnerVideoEdit',
    summary: 'Edit an own video link',
    description: 'Source/caption/hashtag/thumbnail/link changes of an approved video re-enter pending moderation; consent-only changes keep approval. A rejected video returns to pending only with resubmit=true. Removed or owner-deleted videos cannot be edited. Links must be public products/services of the same business.',
  })
  @ApiOkResponse({ type: OwnerVideoDetailDto })
  @AdminErrors({
    ...OWNER_ERRORS,
    409: 'MEDIA_VERSION_CONFLICT for a stale version; VIDEO_INVALID_TRANSITION for removed content or resubmit outside rejected; COMMON_CONFLICT for idempotency key reuse.',
    422: 'MEDIA_VIDEO_SOURCE_INVALID for a non-allow-listed source; MEDIA_LINK_TARGET_INVALID for a foreign or non-public link target.',
  })
  @RateLimit(OWNER_WRITE_LIMIT)
  async edit(
    @Req() request: AuthRequest,
    @Param(new InputPipe(MediaItemParamsSchema)) params: MediaItemParams,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(VideoEditSchema)) input: VideoEdit,
  ) {
    return OwnerVideoDetailSchema.parse(await this.videos.edit(ownerRequest(request), params.id, input));
  }

  @Delete(':id')
  @HttpCode(200)
  @IdempotentMutation()
  @ApiParam(ID_PARAM)
  @ApiBody({ type: ExpectedVersionBodyDto })
  @ApiOperation({
    operationId: 'mediaOwnerVideoDelete',
    summary: 'Owner-delete an own video',
    description: 'Hides the video from every public surface immediately and keeps a removed tombstone for moderation/audit history; returns the tombstone.',
  })
  @ApiOkResponse({ type: OwnerVideoDetailDto })
  @AdminErrors(OWNER_ERRORS)
  @RateLimit(OWNER_WRITE_LIMIT)
  async remove(
    @Req() request: AuthRequest,
    @Param(new InputPipe(MediaItemParamsSchema)) params: MediaItemParams,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(ExpectedVersionBodySchema)) input: ExpectedVersionBody,
  ) {
    return OwnerVideoDetailSchema.parse(await this.videos.remove(ownerRequest(request), params.id, input));
  }
}
