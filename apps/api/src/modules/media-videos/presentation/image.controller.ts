import {
  Body, Controller, Get, Head, Injectable, Param, PayloadTooLargeException,
  Post, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors,
  type CallHandler, type ExecutionContext,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiCreatedResponse, ApiHeader, ApiOkResponse, ApiOperation, ApiResponse,
  ApiParam, ApiProduces, ApiQuery, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { finalize } from 'rxjs';
import type { Response } from 'express';
import {
  MediaAssetParamsSchema, MediaPolicyResultSchema, MediaPublicQuerySchema,
  MediaUploadBodySchema, MediaUploadResultSchema, OWNER_IMAGE_UPLOAD_PURPOSES,
  OwnerImagePolicyParamsSchema, OwnerImagePolicyQuerySchema,
  type MediaPublicQuery, type MediaUploadBody, type OwnerImagePolicyQuery,
  type OwnerImageUploadPurpose,
} from '@apnatown/shared';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { OwnAccount, PublicRoute, Roles, type AuthRequest } from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { DomainError } from '../../../shared/errors/errors';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { adminCommand, AdminErrors } from '../../admin/presentation/admin.dto';
import { ImageService } from '../application/image.service';
import { ImageDeliveryService } from '../application/image-delivery.service';
import { ErrorDto } from '../../../shared/health/health.controller';
import { imageByteRange, imageNotModified } from './image-read-headers';
import { UploadAdmissionGuard } from './upload-admission.guard';

// One shared client bucket across GET, explicit HEAD and Express's GET->HEAD
// fallback. Method switching must never buy another provider/metadata budget.
const PUBLIC_IMAGE_READ = {
  key: 'media.public.read',maximumHits: 120,windowSeconds: 60,subject: 'ip',
} as const;

class MediaUploadDto extends createZodDto(MediaUploadResultSchema) {}
class MediaPolicyDto extends createZodDto(MediaPolicyResultSchema) {}
class MediaPublicQueryDto extends createZodDto(MediaPublicQuerySchema) {}
class OwnerImagePolicyQueryDto extends createZodDto(OwnerImagePolicyQuerySchema) {}

@Injectable()
class ImageMultipart extends FileInterceptor('file', {
  // Text fields: purpose (+ businessId for owner purposes); one file.
  limits: { fileSize: 5_242_880, files: 1, fields: 2, parts: 3, fieldSize: 64 },
}) {
  private static active = 0;
  // One in-flight upload per user so one account cannot hold every slot.
  private static readonly uploaders = new Set<string>();
  override async intercept(ctx: ExecutionContext, next: CallHandler) {
    const userId = ctx.switchToHttp().getRequest<AuthRequest>().principal?.userId ?? '';
    if (ImageMultipart.active >= 2 || ImageMultipart.uploaders.has(userId))
      throw new DomainError('COMMON_RATE_LIMITED', {}, 2);
    ImageMultipart.active++;
    ImageMultipart.uploaders.add(userId);
    const release = () => { ImageMultipart.active--; ImageMultipart.uploaders.delete(userId); };
    try {
      const result = await super.intercept(ctx, next);
      return result.pipe(finalize(release));
    } catch (error) {
      release();
      if (error instanceof PayloadTooLargeException) throw new DomainError('MEDIA_TOO_LARGE');
      throw error;
    }
  }
}

@ApiTags('media')
@Controller('media')
export class ImageController {
  constructor(private readonly images: ImageService, private readonly delivery: ImageDeliveryService) {}

  @Get('policies/catalog_taxonomy')
  @Roles('super_admin')
  @PrivateApi()
  @ApiOperation({ operationId: 'mediaTaxonomyImagePolicy', summary: 'Read configured taxonomy image upload limits' })
  @ApiOkResponse({ type: MediaPolicyDto })
  async policy(@Req() req: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>) {
    return MediaPolicyResultSchema.parse({
      purpose: 'catalog_taxonomy',
      policy: await this.images.policy(adminCommand(req), { purpose: 'catalog_taxonomy', businessId: null }),
    });
  }

  @Get('policies/:purpose')
  @OwnAccount()
  @PrivateApi()
  @ApiParam({ name: 'purpose', schema: { type: 'string', enum: [...OWNER_IMAGE_UPLOAD_PURPOSES] } })
  @ApiQuery({ type: OwnerImagePolicyQueryDto })
  @ApiOperation({ operationId: 'mediaOwnerImagePolicy',
    summary: 'Read configured image upload limits for an owner listing/profile purpose',
    description: 'Requires the caller to own businessId with the capability for that purpose: an approved business with live vendor/provider role for product/service; an editable (draft, pending, rejected, changes-requested or approved) business for logo/cover.' })
  @ApiOkResponse({ type: MediaPolicyDto })
  @AdminErrors({ 403: 'COMMON_FORBIDDEN when the caller does not own businessId or lacks the capability for this purpose',
    503: 'MEDIA_UPLOAD_POLICY_REQUIRED when the purpose policy is disabled or image storage is not configured' })
  async ownerPolicy(@Req() req: AuthRequest,
    @Param(new InputPipe(OwnerImagePolicyParamsSchema)) params: { purpose: OwnerImageUploadPurpose },
    @Query(new InputPipe(OwnerImagePolicyQuerySchema)) query: OwnerImagePolicyQuery) {
    return MediaPolicyResultSchema.parse({
      purpose: params.purpose,
      policy: await this.images.policy(adminCommand(req), { purpose: params.purpose, businessId: query.businessId }),
    });
  }

  @Post('uploads')
  @OwnAccount()
  @PrivateApi()
  @BrowserMutation()
  @ApiHeader({ name: 'Idempotency-Key', required: true,
    description: 'Case-sensitive command key. Retry the identical upload (same purpose, business and bytes) within 24 hours; replay rechecks current authorization and returns the same asset.',
    schema: { type: 'string', minLength: 1, maxLength: 128, pattern: '^[A-Za-z0-9._:-]+$' } })
  @RateLimit({ key: 'media.upload', maximumHits: 20, windowSeconds: 60, subject: 'principal' })
  @UseGuards(UploadAdmissionGuard)
  @UseInterceptors(ImageMultipart)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', additionalProperties: false,
    required: ['purpose', 'file'], properties: {
      purpose: { type: 'string', enum: ['catalog_taxonomy', ...OWNER_IMAGE_UPLOAD_PURPOSES] },
      businessId: { type: 'string', format: 'uuid',
        description: 'Required for product, service, business_profile_logo and business_profile_cover; forbidden for catalog_taxonomy.' },
      file: { type: 'string', format: 'binary' },
    } } })
  @ApiOperation({ operationId: 'mediaUpload', summary: 'Upload a sanitized public-purpose image',
    description: 'catalog_taxonomy requires an active super_admin. Owner purposes require the caller to own businessId: product/service need an approved business with live vendor/provider role; business_profile_logo/cover need an editable business (applicants included, never suspended/inactive). The asset is attachable only by the same owner, for the same business and purpose.' })
  @ApiCreatedResponse({ type: MediaUploadDto })
  @AdminErrors({ 400: 'VALIDATION_ERROR for unknown/missing fields or COMMON_VALIDATION_FAILED for an invalid Idempotency-Key',
    403: 'COMMON_FORBIDDEN when the caller lacks authority for the purpose/business',
    409: 'COMMON_CONFLICT when the key is reused for a different upload or is still in progress',
    413: 'MEDIA_TOO_LARGE', 422: 'MEDIA_TYPE_NOT_ALLOWED or MEDIA_IMAGE_PROCESSING_FAILED',
    429: 'COMMON_RATE_LIMITED with Retry-After',
    503: 'MEDIA_UPLOAD_POLICY_REQUIRED or MEDIA_STORAGE_UNAVAILABLE' })
  async upload(@Req() req: AuthRequest,
    @Body(new InputPipe(MediaUploadBodySchema)) body: MediaUploadBody,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) throw new DomainError('MEDIA_TYPE_NOT_ALLOWED');
    const target = body.purpose === 'catalog_taxonomy'
      ? { purpose: body.purpose, businessId: null }
      : { purpose: body.purpose, businessId: body.businessId };
    return this.images.upload(adminCommand(req), target, file);
  }

  @Get('previews/:assetId')
  @OwnAccount()
  @PrivateApi()
  @RateLimit({ key: 'media.preview.read', maximumHits: 120, windowSeconds: 60, subject: 'principal' })
  @ApiParam({ name: 'assetId', schema: { type: 'string', format: 'uuid' } })
  @ApiOperation({ operationId: 'mediaImagePreview', summary: 'Read an owned image preview',
    description: 'Uploader only, while still holding the authority required to upload that purpose for the same business. Private, no-store; never a provider URL.' })
  @AdminErrors({ 403: 'COMMON_FORBIDDEN when the uploader no longer holds that authority', 404: 'MEDIA_NOT_FOUND' })
  @ApiProduces('image/webp')
  async preview(@Req() req: AuthRequest,
    @Param(new InputPipe(MediaAssetParamsSchema)) params: { assetId: string },
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Res() res: Response) {
    const body = await this.images.preview(adminCommand(req), params.assetId);
    this.headers(res);
    res.setHeader('Content-Length', body.length);
    res.end(req.method === 'HEAD' ? undefined : body);
  }

  @Get('public/:assetId')
  @PublicRoute()
  @RateLimit(PUBLIC_IMAGE_READ)
  @ApiParam({ name: 'assetId', schema: { type: 'string', format: 'uuid' } })
  @ApiQuery({ type: MediaPublicQueryDto })
  @ApiProduces('image/webp')
  @ApiOperation({ operationId: 'mediaPublicImage', summary: 'Read a currently published image placement' })
  @ApiResponse({ status: 304, description: 'Authorized current representation matches If-None-Match; no provider download' })
  @ApiResponse({ status: 416, type: ErrorDto, description: 'Unsupported or unsatisfiable single byte range' })
  @ApiResponse({ status: 429, type: ErrorDto, description: 'Shared image read budget or bounded provider download capacity exhausted' })
  async publicImage(@Req() req: AuthRequest,
    @Param(new InputPipe(MediaAssetParamsSchema)) params: { assetId: string },
    @Query(new InputPipe(MediaPublicQuerySchema)) query: MediaPublicQuery,
    @Res() res: Response) {
    this.headers(res);
    const metadata = await this.delivery.describe(params.assetId,query);
    const etag = `"${params.assetId}-${query.assetVersion}-${query.variantWidth}"`;
    res.setHeader('ETag', etag);
    res.setHeader('Accept-Ranges', 'bytes');
    if (imageNotModified(req.headers['if-none-match'],etag)) return res.status(304).end();
    // RFC 9110: Range is a GET modifier, not a HEAD modifier. Persisted ready
    // variant metadata gives exactly the headers of the complete representation.
    if (req.method === 'HEAD') {
      res.setHeader('Content-Length',metadata.bytes);
      return res.end();
    }
    const range = req.headers.range;
    if (range && (!req.headers['if-range'] || req.headers['if-range'] === etag)) {
      res.setHeader('Content-Range',`bytes */${metadata.bytes}`);
      const selected = imageByteRange(range,metadata.bytes);
      res.removeHeader('Content-Range');
      const partial = await this.delivery.read(params.assetId,query,selected);
      res.status(206).setHeader('Content-Range', `bytes ${selected.start}-${selected.end}/${metadata.bytes}`);
      res.setHeader('Content-Length', partial.length);
      return res.end(partial);
    }
    const body = await this.delivery.read(params.assetId,query);
    res.setHeader('Content-Length', body.length);
    return res.end(body);
  }

  @Head('public/:assetId')
  @PublicRoute()
  @RateLimit(PUBLIC_IMAGE_READ)
  @ApiParam({ name: 'assetId', schema: { type: 'string', format: 'uuid' } })
  @ApiQuery({ type: MediaPublicQueryDto })
  @ApiOperation({ operationId: 'mediaPublicImageHead', summary: 'Authorize current placement and read trusted image metadata without downloading bytes' })
  @ApiResponse({ status: 200, description: 'Current authorized variant metadata; private/no-store' })
  @ApiResponse({ status: 304, description: 'Current authorized variant matches If-None-Match' })
  @ApiResponse({ status: 429, type: ErrorDto, description: 'Same client read budget as image GET' })
  head(@Req() req: AuthRequest,
    @Param(new InputPipe(MediaAssetParamsSchema)) params: { assetId: string },
    @Query(new InputPipe(MediaPublicQuerySchema)) query: MediaPublicQuery,
    @Res() res: Response) {
    return this.publicImage(req, params, query, res);
  }

  private headers(res: Response) {
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}
