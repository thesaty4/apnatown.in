import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Injectable,
  PayloadTooLargeException,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  type CallHandler,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { finalize } from 'rxjs';
import {
  PRODUCT_IMPORT_HEADERS,
  PRODUCT_IMPORT_MAX_BYTES,
  ProductImportPolicyResultSchema,
  ProductImportResultSchema,
} from '@apnatown/shared/products';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { OwnAccount, type AuthRequest } from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { DomainError } from '../../../shared/errors/errors';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors } from '../../admin/presentation/admin.dto';
import { BusinessKindHeader } from '../../businesses/presentation/business.dto';
import { ProductImportService } from '../application/product-import.service';
import {
  CONTEXT_REQUIRED,
  FORBIDDEN,
  IdempotencyKeyHeader,
  NOT_ADMITTED,
  OWNER,
  PRODUCT_READ_LIMIT,
  productCommand,
  productOwner,
} from './product-owner.dto';

class ProductImportResultDto extends createZodDto(ProductImportResultSchema) {}
class ProductImportPolicyDto extends createZodDto(
  ProductImportPolicyResultSchema,
) {}

// TODO(verify): no import-specific rate limit is specified.
const PRODUCT_IMPORT_LIMIT = {
  key: 'products.owner.import',
  maximumHits: 10,
  windowSeconds: 60,
  subject: 'principal',
} as const;
const APPROVAL = 'USERS_APPROVAL_REQUIRED when the business is not approved.';
const HEADERS = PRODUCT_IMPORT_HEADERS.join(',');

/**
 * Owner checks and an enabled policy before any multipart body is buffered
 * (mirrors Media's upload admission guard).
 */
@Injectable()
class ProductImportAdmissionGuard implements CanActivate {
  constructor(private readonly imports: ProductImportService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const request = ctx.switchToHttp().getRequest<AuthRequest>();
    const policy = await this.imports.policy(productOwner(request));
    if (!policy.enabled)
      throw new DomainError('PRODUCT_IMPORT_POLICY_REQUIRED');
    return true;
  }
}

/** Memory-buffered single `file` part, at most the hard byte ceiling. */
@Injectable()
class ProductImportMultipart extends FileInterceptor('file', {
  limits: { fileSize: PRODUCT_IMPORT_MAX_BYTES, files: 1, fields: 0, parts: 1 },
}) {
  private static active = 0;
  // One in-flight import per user so one account cannot hold every slot.
  private static readonly importers = new Set<string>();
  override async intercept(ctx: ExecutionContext, next: CallHandler) {
    const userId =
      ctx.switchToHttp().getRequest<AuthRequest>().principal?.userId ?? '';
    if (
      ProductImportMultipart.active >= 2 ||
      ProductImportMultipart.importers.has(userId)
    )
      throw new DomainError('COMMON_RATE_LIMITED', {}, 2);
    ProductImportMultipart.active++;
    ProductImportMultipart.importers.add(userId);
    const release = () => {
      ProductImportMultipart.active--;
      ProductImportMultipart.importers.delete(userId);
    };
    try {
      const result = await super.intercept(ctx, next);
      return result.pipe(finalize(release));
    } catch (error) {
      release();
      if (error instanceof PayloadTooLargeException)
        throw new DomainError('PRODUCT_IMPORT_LIMIT', { field: 'file' });
      throw error;
    }
  }
}

/**
 * Owner CSV/XLSX product import (Q-47). Registered before the owner product
 * controller so the static `me/products/import` routes win over
 * `me/products/:productId`.
 */
@ApiTags('products')
@PrivateApi()
@OwnAccount()
@Controller('businesses')
export class ProductImportController {
  constructor(private readonly imports: ProductImportService) {}

  @Get('me/products/import/policy')
  @Header('Cache-Control', 'private, no-store')
  @BusinessKindHeader()
  @ApiOperation({
    operationId: 'businessMeProductsImportPolicy',
    summary: 'Read own product import limits and template headers',
    description: `{enabled,maxRows,maxBytes,headers}: maxRows/maxBytes are null while import is not configured or disabled; headers is the exact template header set. ${OWNER}`,
  })
  @ApiOkResponse({ type: ProductImportPolicyDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for unexpected query keys.',
    403: `${APPROVAL} ${FORBIDDEN}`,
    422: CONTEXT_REQUIRED,
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(PRODUCT_READ_LIMIT)
  policy(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
  ) {
    return this.imports.policy(productOwner(request));
  }

  @Post('me/products/import')
  @HttpCode(200)
  @Header('Cache-Control', 'private, no-store')
  @BrowserMutation()
  @BusinessKindHeader()
  @IdempotencyKeyHeader(
    'Case-sensitive key bound to the SHA-256 of the file bytes; retry the identical file within 24 hours to replay its result.',
  )
  @RateLimit(PRODUCT_IMPORT_LIMIT)
  @UseGuards(ProductImportAdmissionGuard)
  @UseInterceptors(ProductImportMultipart)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: `CSV (UTF-8) or XLSX, detected by content. Exact header row: ${HEADERS}.`,
        },
      },
    },
  })
  @ApiOperation({
    operationId: 'businessMeProductsImport',
    summary: 'Import own products from a CSV/XLSX file',
    description: `All-or-nothing: every row is validated first (row numbers are 1-based data rows, header excluded), then all products are created in one transaction with the create defaults. priceINR/mrpINR are plain decimal rupees with at most 2 decimals; tags are comma-separated. No media, variants or specs. Returns {importedCount,productIds}. ${OWNER}`,
  })
  @ApiOkResponse({ type: ProductImportResultDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for extra multipart fields/parts or query keys; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    403: `${APPROVAL} ${FORBIDDEN}`,
    409: 'PRODUCT_SKU_CONFLICT when a SKU was taken concurrently; COMMON_CONFLICT when the Idempotency-Key is reused with a different file or is still in progress.',
    413: "PRODUCT_IMPORT_LIMIT with details.field 'file' (bytes over the configured cap) or 'rows' (more data rows than the configured cap).",
    422: `PRODUCT_IMPORT_INVALID with details.field 'file' (unreadable/unsupported file), 'headers' (with expected/unknown), 'rows' (no data rows), or details.rows[{row,field,code}] (first 100) and details.totalErrors. ${CONTEXT_REQUIRED}`,
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: `PRODUCT_IMPORT_POLICY_REQUIRED while import caps are not configured or disabled. ${NOT_ADMITTED}`,
  })
  import(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(EmptyRequestSchema)) _body: Record<string, never>,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file)
      throw new DomainError('PRODUCT_IMPORT_INVALID', { field: 'file' });
    return this.imports.import(productCommand(request, true), file.buffer);
  }
}
