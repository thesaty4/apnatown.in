import {
  Body, Controller, Get, Head, Injectable, Param, PayloadTooLargeException,
  Post, Query, Req, Res, UploadedFile, UseInterceptors,
  type CallHandler, type ExecutionContext,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse,
  ApiParam, ApiProduces, ApiQuery, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { finalize } from 'rxjs';
import type { Response } from 'express';
import {
  MediaAssetParamsSchema, MediaPolicyResultSchema, MediaPublicQuerySchema,
  MediaUploadResultSchema, TaxonomyUploadBodySchema, type MediaPublicQuery,
} from '@apnatown/shared';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { PublicRoute, Roles, type AuthRequest } from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { DomainError } from '../../../shared/errors/errors';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { adminCommand, IdempotentAdmin, AdminErrors } from '../../admin/presentation/admin.dto';
import { ImageService } from '../application/image.service';
import { ImageDeliveryService } from '../application/image-delivery.service';
import { ErrorDto } from '../../../shared/health/health.controller';
import { imageByteRange, imageNotModified } from './image-read-headers';

// One shared client bucket across GET, explicit HEAD and Express's GET->HEAD
// fallback. Method switching must never buy another provider/metadata budget.
const PUBLIC_IMAGE_READ = {
  key: 'media.public.read',maximumHits: 120,windowSeconds: 60,subject: 'ip',
} as const;

class MediaUploadDto extends createZodDto(MediaUploadResultSchema) {}
class MediaPolicyDto extends createZodDto(MediaPolicyResultSchema) {}
class MediaPublicQueryDto extends createZodDto(MediaPublicQuerySchema) {}

@Injectable()
class ImageMultipart extends FileInterceptor('file', {
  limits: { fileSize: 5_242_880, files: 1, fields: 1, parts: 2, fieldSize: 64 },
}) {
  private static active = 0;
  override async intercept(ctx: ExecutionContext, next: CallHandler) {
    if (ImageMultipart.active >= 2) throw new DomainError('COMMON_RATE_LIMITED', {}, 2);
    ImageMultipart.active++;
    try {
      const result = await super.intercept(ctx, next);
      return result.pipe(finalize(() => { ImageMultipart.active--; }));
    } catch (error) {
      ImageMultipart.active--;
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
      purpose: 'catalog_taxonomy', policy: await this.images.policy(adminCommand(req)),
    });
  }

  @Post('uploads')
  @Roles('super_admin')
  @PrivateApi()
  @BrowserMutation()
  @IdempotentAdmin()
  @RateLimit({ key: 'media.upload', maximumHits: 20, windowSeconds: 60, subject: 'principal' })
  @UseInterceptors(ImageMultipart)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', additionalProperties: false,
    required: ['purpose', 'file'], properties: {
      purpose: { type: 'string', enum: ['catalog_taxonomy'] },
      file: { type: 'string', format: 'binary' },
    } } })
  @ApiOperation({ operationId: 'mediaUpload', summary: 'Upload a sanitized taxonomy image' })
  @ApiCreatedResponse({ type: MediaUploadDto })
  @AdminErrors({ 413: 'MEDIA_TOO_LARGE', 422: 'MEDIA_TYPE_NOT_ALLOWED or MEDIA_IMAGE_PROCESSING_FAILED' })
  async upload(@Req() req: AuthRequest,
    @Body(new InputPipe(TaxonomyUploadBodySchema)) _body: { purpose: 'catalog_taxonomy' },
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) throw new DomainError('MEDIA_TYPE_NOT_ALLOWED');
    return this.images.upload(adminCommand(req), file);
  }

  @Get('previews/:assetId')
  @Roles('super_admin')
  @PrivateApi()
  @ApiParam({ name: 'assetId', schema: { type: 'string', format: 'uuid' } })
  @ApiOperation({ operationId: 'mediaImagePreview', summary: 'Read an owned image preview' })
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
