import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
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
  AdminListingProductPageSchema,
  AdminListingProductParamsSchema,
  AdminProductParamsSchema,
  AdminProductPublicationResultSchema,
  AdminProductPublicationSchema,
  type AdminProductPublication,
} from '@apnatown/shared/admin';
import {
  EmptyRequestSchema,
  PageQuerySchema,
  type PageQuery,
} from '@apnatown/shared/wire';
import {
  adminContext,
  Permission,
  Roles,
  Scoped,
  type AuthRequest,
} from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import {
  PRODUCT_ADMIN,
  type ProductAdminPort,
} from '../../products/application/product-admin.port';
import { AdminErrors, adminCommand } from './admin.dto';
import {
  AdminListingProductPageDto,
  AdminListingProductQueryDto,
  AdminProductPublicationDto,
  AdminProductPublicationResultDto,
  CATALOG_EDIT_FORBIDDEN,
  CATALOG_READ_FORBIDDEN,
  listingCommandKey,
  NOT_ADMITTED,
  READ_LIMIT,
  WRITE_LIMIT,
} from './admin-listings.dto';

/**
 * Products under an admin listing (S-ADMN-03). Registered before
 * `AdminListingsController` so `listings/:businessId/products` never matches
 * `listings/:type/:id`. Products owns reads and the versioned publication.
 */
@ApiTags('admin')
@PrivateApi()
@Roles('admin', 'super_admin')
@Controller('admin')
export class AdminListingProductsController {
  constructor(
    @Inject(PRODUCT_ADMIN) private readonly products: ProductAdminPort,
  ) {}

  @Get('listings/:businessId/products')
  @Permission('catalog', 'view')
  @Scoped('business.listing', 'businessId')
  @ApiQuery({ type: AdminListingProductQueryDto })
  @ApiParam({ name: 'businessId', schema: { type: 'string', format: 'uuid' } })
  @ApiOperation({
    operationId: 'adminListingProducts',
    summary: 'Products of a listing (admin)',
    description:
      'Non-deleted products of a live business/provider listing, including unpublished ones, newest first (keyset; limit 1..50, default 20). Requires catalog:view over the listing area (rechecked in the transaction). private, no-store.',
  })
  @ApiOkResponse({ type: AdminListingProductPageDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for a bad id or unexpected query fields; VALIDATION_ERROR (field cursor) for a tampered or foreign cursor.',
    403: `${CATALOG_READ_FORBIDDEN} ADMIN_SCOPE_FORBIDDEN outside the listing scope.`,
    404: 'BUSINESS_NOT_FOUND for a missing or deleted listing.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(READ_LIMIT)
  async list(
    @Req() request: AuthRequest,
    @Param(new InputPipe(AdminListingProductParamsSchema))
    params: { businessId: string },
    @Query(new InputPipe(PageQuerySchema)) query: PageQuery,
  ) {
    return AdminListingProductPageSchema.parse(
      await this.products.listForBusiness(adminContext(request), {
        businessId: params.businessId,
        ...(query.cursor ? { cursor: query.cursor } : {}),
        limit: query.limit,
      }),
    );
  }

  @Post('products/:productId/publication')
  @HttpCode(200)
  @Permission('catalog', 'edit')
  @Scoped('product.admin', 'productId')
  @BrowserMutation()
  @listingCommandKey()
  @ApiParam({ name: 'productId', schema: { type: 'string', format: 'uuid' } })
  @ApiBody({ type: AdminProductPublicationDto })
  @ApiOperation({
    operationId: 'adminProductPublication',
    summary: 'Publish or unpublish a product (admin)',
    description:
      '{published, reasonKey, expectedVersion} via the Products versioned command. Requires catalog:edit over the owning listing area (rechecked in the transaction); never on a listing the caller owns. The change, an audit entry (before/after, reasonKey) and product events commit atomically; an unchanged state is a no-op. private, no-store.',
  })
  @ApiOkResponse({ type: AdminProductPublicationResultDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for a bad body or unexpected fields; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    403: CATALOG_EDIT_FORBIDDEN,
    404: 'PRODUCT_NOT_FOUND for a missing/deleted product or listing.',
    409: 'PRODUCT_VERSION_CONFLICT for a stale expectedVersion; idempotency conflicts.',
    422: 'ADMIN_SELF_ACTION when the caller owns the listing.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(WRITE_LIMIT)
  async publication(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(AdminProductParamsSchema))
    params: { productId: string },
    @Body(new InputPipe(AdminProductPublicationSchema))
    input: AdminProductPublication,
  ) {
    return AdminProductPublicationResultSchema.parse(
      await this.products.setPublishedByAdmin(adminCommand(request), {
        productId: params.productId,
        ...input,
      }),
    );
  }
}
