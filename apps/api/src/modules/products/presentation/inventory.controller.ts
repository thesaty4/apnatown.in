import {
  Body,
  Controller,
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
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  InventoryListQuerySchema,
  InventoryRestockLowSchema,
  InventoryUpdateSchema,
  ProductParamsSchema,
  type InventoryListQuery,
  type InventoryRestockLow,
  type InventoryUpdate,
  type ProductParams,
} from '@apnatown/shared/products';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { OwnAccount, type AuthRequest } from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors } from '../../admin/presentation/admin.dto';
import { BusinessKindHeader } from '../../businesses/presentation/business.dto';
import { InventoryService } from '../application/inventory.service';
import { ProductBulkService } from '../application/product-bulk.service';
import {
  CONTEXT_REQUIRED,
  FORBIDDEN,
  IdempotencyKeyHeader,
  InventoryItemDto,
  InventoryListQueryDto,
  InventoryPageDto,
  InventoryRestockLowDto,
  InventoryUpdateDto,
  NOT_ADMITTED,
  OWNER,
  PRODUCT_ID,
  PRODUCT_READ_LIMIT,
  PRODUCT_WRITE_LIMIT,
  ProductBulkResultDto,
  productCommand,
  productOwner,
} from './product-owner.dto';

/** Owner inventory (F-VD-009, F-PV-005; S-VEND-08). */
@ApiTags('products')
@PrivateApi()
@OwnAccount()
@Controller('businesses')
export class InventoryController {
  constructor(
    private readonly inventory: InventoryService,
    private readonly bulk: ProductBulkService,
  ) {}

  @Get('me/inventory')
  @Header('Cache-Control', 'private, no-store')
  @BusinessKindHeader()
  @ApiOperation({
    operationId: 'businessMeInventory',
    summary: "The caller's inventory",
    description: `Inventory of non-deleted products, newest product first, keyset-paginated. ?cursor=, ?limit= (1–50). Returns {items,nextCursor}; lowStock is onHand <= lowStockThreshold. ${OWNER}`,
  })
  @ApiQuery({ type: InventoryListQueryDto })
  @ApiOkResponse({ type: InventoryPageDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for unexpected parameters or X-Business-Kind; COMMON_VALIDATION_FAILED for a cursor from another business.',
    403: FORBIDDEN,
    422: CONTEXT_REQUIRED,
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(PRODUCT_READ_LIMIT)
  list(
    @Req() request: AuthRequest,
    @Query(new InputPipe(InventoryListQuerySchema)) query: InventoryListQuery,
  ) {
    return this.inventory.list(productOwner(request), query);
  }

  @Post('me/inventory/restock-low')
  @HttpCode(200)
  @Header('Cache-Control', 'private, no-store')
  @BrowserMutation()
  @BusinessKindHeader()
  @IdempotencyKeyHeader(
    'Case-sensitive key; retry the identical restock within 24 hours to replay its result.',
  )
  @ApiBody({ type: InventoryRestockLowDto })
  @ApiOperation({
    operationId: 'businessMeInventoryRestockLow',
    summary: 'Restock all low items to 20',
    description: `{targetOnHand:20,expectedVersions:[{productId,version}]} where the list names exactly every currently low row (onHand <= lowStockThreshold) with its inventory version. All-or-nothing; only the quantity changes. Returns {changedIds}. ${OWNER}`,
  })
  @ApiOkResponse({ type: ProductBulkResultDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for invalid fields or unexpected keys; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    403: FORBIDDEN,
    409: 'PRODUCT_VERSION_CONFLICT when the low set or any version changed; Idempotency-Key reused with a different command or still in progress.',
    422: `PRODUCT_BULK_INVALID for duplicate product ids. ${CONTEXT_REQUIRED}`,
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(PRODUCT_WRITE_LIMIT)
  restockLow(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(InventoryRestockLowSchema)) input: InventoryRestockLow,
  ) {
    return this.bulk.restockLow(productCommand(request, true), input);
  }

  @Patch('me/inventory/:productId')
  @Header('Cache-Control', 'private, no-store')
  @BrowserMutation()
  @BusinessKindHeader()
  @ApiParam(PRODUCT_ID)
  @ApiBody({ type: InventoryUpdateDto })
  @ApiOperation({
    operationId: 'businessMeInventoryUpdate',
    summary: 'Adjust one product inventory',
    description: `{delta?,availableForSale?,lowStockThreshold?,expectedVersion} (inventory version; at least one change). Stock never goes below zero; a delta reaching zero marks the item unavailable; availableForSale=true at zero stock sets onHand to 10 (Q-49). ${OWNER}`,
  })
  @ApiOkResponse({ type: InventoryItemDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for invalid fields, no change or unexpected keys.',
    403: `PRODUCT_NOT_OWNED for another business's product. ${FORBIDDEN}`,
    404: 'PRODUCT_NOT_FOUND for a missing or deleted product.',
    409: 'PRODUCT_VERSION_CONFLICT for a stale expectedVersion.',
    422: `PRODUCT_STOCK_INVALID when stock would go below zero. ${CONTEXT_REQUIRED}`,
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(PRODUCT_WRITE_LIMIT)
  update(
    @Req() request: AuthRequest,
    @Param(new InputPipe(ProductParamsSchema)) params: ProductParams,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(InventoryUpdateSchema)) input: InventoryUpdate,
  ) {
    return this.inventory.update(
      productCommand(request),
      params.productId,
      input,
    );
  }
}
