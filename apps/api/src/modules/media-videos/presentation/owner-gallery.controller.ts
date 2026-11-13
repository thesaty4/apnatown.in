import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  CreateGalleryPhotoSchema,
  ExpectedVersionBodySchema,
  MediaItemParamsSchema,
  MediaOrderSchema,
  OwnerGalleryPageSchema,
  OwnerGalleryPhotoSchema,
  UpdateGalleryPhotoSchema,
  UpdateMediaOrderSchema,
  type CreateGalleryPhoto,
  type ExpectedVersionBody,
  type MediaItemParams,
  type UpdateGalleryPhoto,
  type UpdateMediaOrder,
} from '@apnatown/shared';
import { EmptyRequestSchema, PageQuerySchema, type PageQuery } from '@apnatown/shared/wire';
import { createZodDto } from 'nestjs-zod';
import type { AuthRequest } from '../../../shared/auth';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors } from '../../admin/presentation/admin.dto';
import { MediaOrderService } from '../application/media-order.service';
import { OwnerGalleryService } from '../application/owner-gallery.service';
import {
  IdempotentMutation,
  MediaOwnerApi,
  OWNER_ERRORS,
  OWNER_READ_LIMIT,
  OWNER_WRITE_LIMIT,
} from './media-owner.decorators';
import { ExpectedVersionBodyDto, MediaOrderDto, UpdateMediaOrderDto } from './owner-video-manage.controller';
import { ownerRequest } from './video.controller';

class CreateGalleryPhotoDto extends createZodDto(CreateGalleryPhotoSchema) {}
class UpdateGalleryPhotoDto extends createZodDto(UpdateGalleryPhotoSchema) {}
class OwnerGalleryPhotoDto extends createZodDto(OwnerGalleryPhotoSchema) {}
class OwnerGalleryPageDto extends createZodDto(OwnerGalleryPageSchema) {}
class OwnerGalleryQueryDto extends createZodDto(PageQuerySchema) {}

const ID_PARAM = { name: 'id', schema: { type: 'string', format: 'uuid' } } as const;
const LINK_ERRORS = {
  ...OWNER_ERRORS,
  422: 'MEDIA_LINK_TARGET_INVALID when linkedTarget is not a public product/service of the same business.',
} as const;

/** Owner Gallery manager for gallery-only photos (`gallery` purpose uploads). */
@ApiTags('media')
@MediaOwnerApi()
@Controller('businesses/me/gallery')
export class OwnerGalleryController {
  constructor(
    private readonly gallery: OwnerGalleryService,
    private readonly order: MediaOrderService,
  ) {}

  @Get('order')
  @ApiOperation({ operationId: 'mediaOwnerGalleryOrderGet', summary: 'Read the owner Gallery manager order' })
  @ApiOkResponse({ type: MediaOrderDto })
  @AdminErrors(OWNER_ERRORS)
  @RateLimit(OWNER_READ_LIMIT)
  async getOrder(@Req() request: AuthRequest, @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>) {
    return MediaOrderSchema.parse(await this.order.get(ownerRequest(request), 'gallery'));
  }

  @Put('order')
  @IdempotentMutation()
  @ApiBody({ type: UpdateMediaOrderDto })
  @ApiOperation({
    operationId: 'mediaOwnerGalleryOrderPut',
    summary: 'Replace the owner Gallery manager order',
    description: 'All-or-nothing: orderedIds must be exactly the current gallery-only photo membership without duplicates and expectedOrderVersion must match.',
  })
  @ApiOkResponse({ type: MediaOrderDto })
  @AdminErrors({ ...OWNER_ERRORS, 422: 'MEDIA_LINK_TARGET_INVALID when orderedIds differs from the current list membership.' })
  @RateLimit(OWNER_WRITE_LIMIT)
  async putOrder(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(UpdateMediaOrderSchema)) input: UpdateMediaOrder,
  ) {
    return MediaOrderSchema.parse(await this.order.put(ownerRequest(request), 'gallery', input));
  }

  @Get()
  @ApiQuery({ type: OwnerGalleryQueryDto })
  @ApiOperation({
    operationId: 'mediaOwnerGalleryList',
    summary: 'List own gallery-only photos in manager order',
    description: 'Owner previews use the owner-only preview gateway; includes moderation state and version.',
  })
  @ApiOkResponse({ type: OwnerGalleryPageDto })
  @AdminErrors(OWNER_ERRORS)
  @RateLimit(OWNER_READ_LIMIT)
  async list(@Req() request: AuthRequest, @Query(new InputPipe(PageQuerySchema)) query: PageQuery) {
    return OwnerGalleryPageSchema.parse(await this.gallery.list(ownerRequest(request), query));
  }

  @Post()
  @IdempotentMutation()
  @ApiBody({ type: CreateGalleryPhotoDto })
  @ApiOperation({
    operationId: 'mediaOwnerGalleryCreate',
    summary: 'Add an uploaded gallery photo',
    description: 'assetId must be a ready, own `gallery` purpose upload of this business that is not already placed; appended to the end of the manager order.',
  })
  @ApiCreatedResponse({ type: OwnerGalleryPhotoDto })
  @AdminErrors({
    ...LINK_ERRORS,
    404: 'MEDIA_NOT_FOUND for a missing, foreign, non-ready or non-gallery asset.',
    409: 'COMMON_CONFLICT when the asset is already in the gallery, the gallery is full, or the idempotency key is reused.',
  })
  @RateLimit(OWNER_WRITE_LIMIT)
  async create(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(CreateGalleryPhotoSchema)) input: CreateGalleryPhoto,
  ) {
    return OwnerGalleryPhotoSchema.parse(await this.gallery.create(ownerRequest(request), input));
  }

  @Get(':id')
  @ApiParam(ID_PARAM)
  @ApiOperation({ operationId: 'mediaOwnerGalleryGet', summary: 'Read one own gallery-only photo' })
  @ApiOkResponse({ type: OwnerGalleryPhotoDto })
  @AdminErrors(OWNER_ERRORS)
  @RateLimit(OWNER_READ_LIMIT)
  async get(
    @Req() request: AuthRequest,
    @Param(new InputPipe(MediaItemParamsSchema)) params: MediaItemParams,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
  ) {
    return OwnerGalleryPhotoSchema.parse(await this.gallery.get(ownerRequest(request), params.id));
  }

  @Patch(':id')
  @IdempotentMutation()
  @ApiParam(ID_PARAM)
  @ApiBody({ type: UpdateGalleryPhotoDto })
  @ApiOperation({
    operationId: 'mediaOwnerGalleryUpdate',
    summary: 'Edit caption or linked product/service of an own gallery photo',
    description: 'null clears caption/linkedTarget; omitted fields are unchanged.',
  })
  @ApiOkResponse({ type: OwnerGalleryPhotoDto })
  @AdminErrors(LINK_ERRORS)
  @RateLimit(OWNER_WRITE_LIMIT)
  async update(
    @Req() request: AuthRequest,
    @Param(new InputPipe(MediaItemParamsSchema)) params: MediaItemParams,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(UpdateGalleryPhotoSchema)) input: UpdateGalleryPhoto,
  ) {
    return OwnerGalleryPhotoSchema.parse(await this.gallery.update(ownerRequest(request), params.id, input));
  }

  @Delete(':id')
  @HttpCode(200)
  @IdempotentMutation()
  @ApiParam(ID_PARAM)
  @ApiBody({ type: ExpectedVersionBodyDto })
  @ApiOperation({
    operationId: 'mediaOwnerGalleryDelete',
    summary: 'Remove an own gallery-only photo',
    description: 'Removes the photo from the Gallery immediately and returns the removed item.',
  })
  @ApiOkResponse({ type: OwnerGalleryPhotoDto })
  @AdminErrors(OWNER_ERRORS)
  @RateLimit(OWNER_WRITE_LIMIT)
  async remove(
    @Req() request: AuthRequest,
    @Param(new InputPipe(MediaItemParamsSchema)) params: MediaItemParams,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(ExpectedVersionBodySchema)) input: ExpectedVersionBody,
  ) {
    return OwnerGalleryPhotoSchema.parse(await this.gallery.remove(ownerRequest(request), params.id, input));
  }
}
