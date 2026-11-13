import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  ProductBulkCommandSchema,
  ProductCreateSchema,
  ProductDeleteQuerySchema,
  ProductOwnerListQuerySchema,
  ProductParamsSchema,
  ProductUpdateSchema,
  type ProductBulkCommand,
  type ProductCreate,
  type ProductDeleteQuery,
  type ProductOwnerListQuery,
  type ProductParams,
  type ProductUpdate,
} from '@apnatown/shared/products';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { OwnAccount, type AuthRequest } from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors } from '../../admin/presentation/admin.dto';
import { BusinessKindHeader } from '../../businesses/presentation/business.dto';
import { ProductBulkService } from '../application/product-bulk.service';
import { ProductOwnerService } from '../application/product-owner.service';
import { ProductWriteService } from '../application/product-write.service';
import {
  CONTEXT_REQUIRED,
  FORBIDDEN,
  IdempotencyKeyHeader,
  NOT_ADMITTED,
  OWNER,
  PRODUCT_ID,
  PRODUCT_READ_LIMIT,
  PRODUCT_WRITE_LIMIT,
  ProductBulkCommandDto,
  ProductBulkResultDto,
  ProductCreateDto,
  ProductDeleteQueryDto,
  ProductOwnerDto,
  ProductOwnerListQueryDto,
  ProductOwnerPageDto,
  ProductUpdateDto,
  productCommand,
  productOwner,
} from './product-owner.dto';

/**
 * Owner bulk product command. Registered before the owner product controller
 * so the static `me/products/bulk` route wins over `me/products/:productId`.
 */
@ApiTags('products')
@PrivateApi()
@OwnAccount()
@Controller('businesses')
export class ProductBulkController {
  constructor(private readonly bulk: ProductBulkService) {}

  @Patch('me/products/bulk')
  @Header('Cache-Control', 'private, no-store')
  @BrowserMutation()
  @BusinessKindHeader()
  @IdempotencyKeyHeader(
    'Case-sensitive key; retry the identical command within 24 hours to replay its result.',
  )
  @ApiBody({ type: ProductBulkCommandDto })
  @ApiOperation({
    operationId: 'businessMeProductsBulk',
    summary: 'Bulk mark in/out of stock or delete own products',
    description: `{productIds[1–50, unique],action:mark_in_stock|mark_out_of_stock|delete,expectedVersions[]} with expectedVersions[i] guarding productIds[i]: the inventory version for stock actions, the product version for delete. All-or-nothing: one missing, foreign or stale product rejects the whole command. mark_in_stock on zero stock sets 10 (Q-49). Returns {changedIds}. ${OWNER}`,
  })
  @ApiOkResponse({ type: ProductBulkResultDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for invalid ids/action/versions or unexpected keys; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    403: `PRODUCT_NOT_OWNED when any product belongs to another business. ${FORBIDDEN}`,
    404: 'PRODUCT_NOT_FOUND when any product is missing or deleted.',
    409: 'PRODUCT_VERSION_CONFLICT for any stale version; Idempotency-Key reused with a different command or still in progress.',
    422: `PRODUCT_BULK_INVALID for mismatched array lengths or duplicate ids. ${CONTEXT_REQUIRED}`,
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(PRODUCT_WRITE_LIMIT)
  run(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(ProductBulkCommandSchema)) input: ProductBulkCommand,
  ) {
    return this.bulk.bulk(productCommand(request, true), input);
  }
}

/** Owner product manager (F-VD-004, F-PV-005; S-VEND-05/06, S-PROV-06/07). */
@ApiTags('products')
@PrivateApi()
@OwnAccount()
@Controller('businesses')
export class ProductOwnerController {
  constructor(
    private readonly reads: ProductOwnerService,
    private readonly writes: ProductWriteService,
  ) {}

  @Get('me/products')
  @Header('Cache-Control', 'private, no-store')
  @BusinessKindHeader()
  @ApiOperation({
    operationId: 'businessMeProducts',
    summary: "The caller's products",
    description: `Non-deleted products, newest first, keyset-paginated. ?query= (name/SKU contains, 1–100), ?stock=low|out_of_stock (low: onHand <= lowStockThreshold; out_of_stock: not available or zero stock), ?cursor=, ?limit= (1–50). Returns {items,nextCursor}. ${OWNER}`,
  })
  @ApiQuery({ type: ProductOwnerListQueryDto })
  @ApiOkResponse({ type: ProductOwnerPageDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for invalid filters/unexpected parameters or X-Business-Kind; COMMON_VALIDATION_FAILED for a cursor from another filter or business.',
    403: FORBIDDEN,
    422: CONTEXT_REQUIRED,
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(PRODUCT_READ_LIMIT)
  list(
    @Req() request: AuthRequest,
    @Query(new InputPipe(ProductOwnerListQuerySchema))
    query: ProductOwnerListQuery,
  ) {
    return this.reads.list(productOwner(request), query);
  }

  @Post('me/products')
  @HttpCode(201)
  @Header('Cache-Control', 'private, no-store')
  @BrowserMutation()
  @BusinessKindHeader()
  @IdempotencyKeyHeader(
    'Case-sensitive key; retry the identical product within 24 hours to replay the created result.',
  )
  @ApiBody({ type: ProductCreateDto })
  @ApiOperation({
    operationId: 'businessMeProductCreate',
    summary: 'Create a product',
    description: `Allow-listed fields; money is integer paise with mrpPaise >= pricePaise. The category/subcategory must be an active product pair. variants are ordered labels (unique, no ids on create). media is ≤5 ordered ready product images uploaded by the caller for this business; an omitted showInGallery uses the business Gallery default. featuredSelected=true requires current Premium entitlement. A missing SKU is generated; the slug is generated once. Inventory defaults: onHand 10, lowStockThreshold 5, available. ${OWNER}`,
  })
  @ApiCreatedResponse({ type: ProductOwnerDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for invalid fields or unexpected keys; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    403: `USERS_APPROVAL_REQUIRED when the business is not approved. ${FORBIDDEN}`,
    409: 'PRODUCT_SKU_CONFLICT for a SKU already used by the business; FEATURED_ENTITLEMENT_UNAVAILABLE without Premium entitlement; Idempotency-Key reused with a different product or still in progress.',
    422: `PRODUCT_INVALID {field} for taxonomy, MRP, variants or media; PRODUCT_STOCK_INVALID for invalid stock. ${CONTEXT_REQUIRED}`,
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(PRODUCT_WRITE_LIMIT)
  create(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(ProductCreateSchema)) input: ProductCreate,
  ) {
    return this.writes.create(productCommand(request, true), input);
  }

  @Get('me/products/:productId')
  @Header('Cache-Control', 'private, no-store')
  @BusinessKindHeader()
  @ApiParam(PRODUCT_ID)
  @ApiOperation({
    operationId: 'businessMeProduct',
    summary: 'One product of the caller',
    description: `Full owner product DTO with active variants and inventory. ${OWNER}`,
  })
  @ApiOkResponse({ type: ProductOwnerDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an invalid id or unexpected parameters.',
    403: `PRODUCT_NOT_OWNED for another business's product. ${FORBIDDEN}`,
    404: 'PRODUCT_NOT_FOUND for a missing or deleted product.',
    422: CONTEXT_REQUIRED,
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(PRODUCT_READ_LIMIT)
  detail(
    @Req() request: AuthRequest,
    @Param(new InputPipe(ProductParamsSchema)) params: ProductParams,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
  ) {
    return this.reads.detail(productOwner(request), params.productId);
  }

  @Patch('me/products/:productId')
  @Header('Cache-Control', 'private, no-store')
  @BrowserMutation()
  @BusinessKindHeader()
  @ApiParam(PRODUCT_ID)
  @ApiBody({ type: ProductUpdateDto })
  @ApiOperation({
    operationId: 'businessMeProductUpdate',
    summary: 'Edit a product',
    description: `Partial allow-listed fields + expectedVersion (product version, always bumped). variants/media/tags/specs replace the whole ordered list; an existing variant id must belong to this product and omitted variants are deactivated. inventory {onHand?,lowStockThreshold?,availableForSale?,expectedVersion} (inventory version) commits with the edit. sku:null restores the generated SKU. A NEW featured selection requires Premium entitlement; a retained one stays stored. ${OWNER}`,
  })
  @ApiOkResponse({ type: ProductOwnerDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for invalid fields or unexpected keys.',
    403: `PRODUCT_NOT_OWNED for another business's product. ${FORBIDDEN}`,
    404: 'PRODUCT_NOT_FOUND for a missing or deleted product.',
    409: 'PRODUCT_VERSION_CONFLICT for a stale product or inventory version; PRODUCT_SKU_CONFLICT; FEATURED_ENTITLEMENT_UNAVAILABLE.',
    422: `PRODUCT_INVALID {field}; PRODUCT_STOCK_INVALID. ${CONTEXT_REQUIRED}`,
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(PRODUCT_WRITE_LIMIT)
  update(
    @Req() request: AuthRequest,
    @Param(new InputPipe(ProductParamsSchema)) params: ProductParams,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(ProductUpdateSchema)) input: ProductUpdate,
  ) {
    return this.writes.update(productCommand(request), params.productId, input);
  }

  @Delete('me/products/:productId')
  @HttpCode(204)
  @Header('Cache-Control', 'private, no-store')
  @BrowserMutation()
  @BusinessKindHeader()
  @ApiParam(PRODUCT_ID)
  @ApiOperation({
    operationId: 'businessMeProductDelete',
    summary: 'Soft-delete a product',
    description: `?expectedVersion= (product version). Repeating the delete of an already deleted own product is a no-op 204. ${OWNER}`,
  })
  @ApiQuery({ type: ProductDeleteQueryDto })
  @ApiNoContentResponse({ description: 'Deleted.' })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an invalid id/version or unexpected parameters.',
    403: `PRODUCT_NOT_OWNED for another business's product. ${FORBIDDEN}`,
    404: 'PRODUCT_NOT_FOUND for a missing product.',
    409: 'PRODUCT_VERSION_CONFLICT for a stale expectedVersion.',
    422: CONTEXT_REQUIRED,
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(PRODUCT_WRITE_LIMIT)
  async remove(
    @Req() request: AuthRequest,
    @Param(new InputPipe(ProductParamsSchema)) params: ProductParams,
    @Query(new InputPipe(ProductDeleteQuerySchema)) query: ProductDeleteQuery,
  ): Promise<void> {
    await this.writes.remove(
      productCommand(request),
      params.productId,
      query.expectedVersion,
    );
  }
}
