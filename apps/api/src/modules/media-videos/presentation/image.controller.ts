import {
  Body, Controller, Get, Head, Injectable, Param, PayloadTooLargeException,
  Post, Query, Req, Res, UploadedFile, UseInterceptors,
  type CallHandler, type ExecutionContext,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation,
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
  @ApiParam({ name: 'assetId', schema: { type: 'string', format: 'uuid' } })
  @ApiQuery({ type: MediaPublicQueryDto })
  @ApiProduces('image/webp')
  @ApiOperation({ operationId: 'mediaPublicImage', summary: 'Read a currently published image placement' })
  async publicImage(@Req() req: AuthRequest,
    @Param(new InputPipe(MediaAssetParamsSchema)) params: { assetId: string },
    @Query(new InputPipe(MediaPublicQuerySchema)) query: MediaPublicQuery,
    @Res() res: Response) {
    const body = await this.delivery.read(params.assetId, query);
    this.headers(res);
    const etag = `"${params.assetId}-${query.assetVersion}-${query.variantWidth}"`;
    res.setHeader('ETag', etag);
    res.setHeader('Accept-Ranges', 'bytes');
    if (req.headers['if-none-match'] === etag) return res.status(304).end();
    const range = req.headers.range;
    if (range && (!req.headers['if-range'] || req.headers['if-range'] === etag)) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) throw new DomainError('MEDIA_RANGE_INVALID');
      const start = match[1] ? Number(match[1]) : Math.max(0, body.length - Number(match[2]));
      const end = match[1] && match[2] ? Math.min(Number(match[2]), body.length - 1) : body.length - 1;
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end ||
          start >= body.length || (!match[1] && Number(match[2]) === 0))
        throw new DomainError('MEDIA_RANGE_INVALID');
      const partial = body.subarray(start, end + 1);
      res.status(206).setHeader('Content-Range', `bytes ${start}-${end}/${body.length}`);
      res.setHeader('Content-Length', partial.length);
      return res.end(req.method === 'HEAD' ? undefined : partial);
    }
    res.setHeader('Content-Length', body.length);
    return res.end(req.method === 'HEAD' ? undefined : body);
  }

  @Head('public/:assetId')
  @PublicRoute()
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
