import { Body, Controller, Get, Header, Put, Query, Req } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ProductPillsReplaceSchema,
  type ProductPillsReplace,
} from '@apnatown/shared/products';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { OwnAccount, type AuthRequest } from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors } from '../../admin/presentation/admin.dto';
import { BusinessKindHeader } from '../../businesses/presentation/business.dto';
import { ProductPillsService } from '../application/product-pills.service';
import {
  CONTEXT_REQUIRED,
  FORBIDDEN,
  NOT_ADMITTED,
  OWNER,
  PRODUCT_READ_LIMIT,
  PRODUCT_WRITE_LIMIT,
  ProductPillsDto,
  ProductPillsReplaceDto,
  productCommand,
  productOwner,
} from './product-owner.dto';

/** Owner customer-facing product pill preferences (F-VD-005; S-VEND-05). */
@ApiTags('products')
@PrivateApi()
@OwnAccount()
@Controller('businesses')
export class ProductPillsController {
  constructor(private readonly pills: ProductPillsService) {}

  @Get('me/product-pills')
  @Header('Cache-Control', 'private, no-store')
  @BusinessKindHeader()
  @ApiOperation({
    operationId: 'businessMeProductPills',
    summary: "The caller's product pill preferences",
    description: `Saved preferences (configured:true) in position order, then catalog defaults (configured:false) for the business's other active product subcategories. labelEn/labelHi null use catalogNameEn/catalogNameHi. ${OWNER}`,
  })
  @ApiOkResponse({ type: ProductPillsDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for unexpected parameters or X-Business-Kind.',
    403: FORBIDDEN,
    422: CONTEXT_REQUIRED,
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(PRODUCT_READ_LIMIT)
  mine(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
  ) {
    return this.pills.mine(productOwner(request));
  }

  @Put('me/product-pills')
  @Header('Cache-Control', 'private, no-store')
  @BrowserMutation()
  @BusinessKindHeader()
  @ApiBody({ type: ProductPillsReplaceDto })
  @ApiOperation({
    operationId: 'businessMeProductPillsReplace',
    summary: "Replace the caller's product pill preferences",
    description: `{items:[{subcategoryId,position,labelEn?,labelHi?,hidden}]} replaces all saved preferences (idempotent). Subcategory ids and positions must be unique and each id an active product subcategory used by the business's products. Catalog taxonomy never changes. Returns the merged list as GET. ${OWNER}`,
  })
  @ApiOkResponse({ type: ProductPillsDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for invalid fields or unexpected keys.',
    403: FORBIDDEN,
    422: `PRODUCT_PILL_INVALID for duplicate ids/positions or an id that is not one of the business's active product subcategories. ${CONTEXT_REQUIRED}`,
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(PRODUCT_WRITE_LIMIT)
  replace(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(ProductPillsReplaceSchema)) input: ProductPillsReplace,
  ) {
    return this.pills.replace(productCommand(request), input);
  }
}
