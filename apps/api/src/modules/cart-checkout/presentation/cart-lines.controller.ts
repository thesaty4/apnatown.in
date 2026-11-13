import { Body, Controller, Delete, HttpCode, Param, Patch, Post, Query, Req, Res } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  AddCartLineSchema,
  CartLineParamsSchema,
  CartLineVersionsSchema,
  UpdateCartLineSchema,
  type AddCartLine,
  type Cart,
  type CartLineParams,
  type CartLineVersions,
  type UpdateCartLine,
} from '@apnatown/shared/cart';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { SessionRoute, type AuthRequest } from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors } from '../../admin/presentation/admin.dto';
import { CartLinesService } from '../application/cart-lines.service';
import type { CartActor } from '../application/cart-support';
import { GuestCartCapability } from '../application/guest-cart-capability';
import {
  AddCartLineDto,
  CART_OWNER,
  COMMON_ERRORS,
  CartCommand,
  CartDto,
  CartLineVersionsDto,
  LineParam,
  UpdateCartLineDto,
  WRITE_LIMITS,
  cartActor,
} from './cart.dto';
import { GuestCartCookie } from './guest-cart.cookie';

const BASE_ERRORS = {
  400: 'VALIDATION_ERROR for invalid/unexpected fields, a client-supplied price/stock/cart ID or query parameters; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
  ...COMMON_ERRORS,
} as const;
const LINE_ERRORS = {
  ...BASE_ERRORS,
  404: 'CART_LINE_NOT_FOUND unless the line belongs to the caller’s cart; CART_NOT_FOUND for a guest without a valid guest-cart cookie (call GET /cart first).',
  409: 'CART_VERSION_CONFLICT when expectedCartVersion or expectedVersion is stale; COMMON_CONFLICT for a reused key with a different request or one still in progress.',
} as const;
const VERSIONS = 'Body {expectedVersion (line), expectedCartVersion} → the updated CartDTO.';

/** Cart line commands (F-CK-001, S-CUST-10): key + optimistic versions. */
@ApiTags('cart')
@PrivateApi()
@Controller('cart/lines')
export class CartLinesController {
  constructor(
    private readonly lines: CartLinesService,
    private readonly guest: GuestCartCapability,
    private readonly cookie: GuestCartCookie,
  ) {}

  @Post()
  @HttpCode(200)
  @SessionRoute()
  @BrowserMutation()
  @CartCommand()
  @ApiBody({ type: AddCartLineDto })
  @ApiOperation({
    operationId: 'cartLineAdd',
    summary: 'Add a product (and label) to the cart',
    description: `${CART_OWNER} {productId, variantId (null for products without labels; an active own label otherwise), quantity 1–10, expectedCartVersion (0 only for the not-yet-created cart)}. An existing line with the same (productId,variantId) is incremented and made active. Price and stock are read server-side; all labels share the product stock.`,
  })
  @ApiOkResponse({ type: CartDto })
  @AdminErrors({
    ...BASE_ERRORS,
    404: 'CART_NOT_FOUND for a guest without a valid guest-cart cookie (call GET /cart first).',
    409: 'PRODUCT_NOT_AVAILABLE when the product is not publicly purchasable or out of stock; CART_VERSION_CONFLICT for a stale expectedCartVersion or a lost concurrent first add; COMMON_CONFLICT for a reused key with a different request or one still in progress.',
    422: 'CART_LINE_INVALID for a missing/foreign/inactive label or the cart line limit; CART_QUANTITY_INVALID when the line would exceed 10 or the shared product stock.',
  })
  @RateLimit(...WRITE_LIMITS)
  async add(
    @Req() request: AuthRequest,
    @Res({ passthrough: true }) response: Response,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(AddCartLineSchema)) input: AddCartLine,
  ) {
    return this.respond(request, response, (actor) => this.lines.add(actor, input));
  }

  @Patch(':lineId')
  @SessionRoute()
  @BrowserMutation()
  @CartCommand()
  @LineParam()
  @ApiBody({ type: UpdateCartLineDto })
  @ApiOperation({
    operationId: 'cartLineUpdate',
    summary: 'Change a cart line quantity',
    description: `${CART_OWNER} {quantity 1–10, expectedVersion, expectedCartVersion}. Increasing an active line revalidates availability, label and shared stock.`,
  })
  @ApiOkResponse({ type: CartDto })
  @AdminErrors({
    ...LINE_ERRORS,
    422: 'CART_QUANTITY_INVALID when an increase exceeds the shared product stock or the product is no longer purchasable.',
  })
  @RateLimit(...WRITE_LIMITS)
  async update(
    @Req() request: AuthRequest,
    @Res({ passthrough: true }) response: Response,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(CartLineParamsSchema)) params: CartLineParams,
    @Body(new InputPipe(UpdateCartLineSchema)) input: UpdateCartLine,
  ) {
    return this.respond(request, response, (actor) => this.lines.update(actor, params.lineId, input));
  }

  @Delete(':lineId')
  @SessionRoute()
  @BrowserMutation()
  @CartCommand()
  @LineParam()
  @ApiBody({ type: CartLineVersionsDto })
  @ApiOperation({ operationId: 'cartLineRemove', summary: 'Remove a cart line', description: `${CART_OWNER} ${VERSIONS}` })
  @ApiOkResponse({ type: CartDto })
  @AdminErrors(LINE_ERRORS)
  @RateLimit(...WRITE_LIMITS)
  async remove(
    @Req() request: AuthRequest,
    @Res({ passthrough: true }) response: Response,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(CartLineParamsSchema)) params: CartLineParams,
    @Body(new InputPipe(CartLineVersionsSchema)) input: CartLineVersions,
  ) {
    return this.respond(request, response, (actor) => this.lines.remove(actor, params.lineId, input));
  }

  @Post(':lineId/save-for-later')
  @HttpCode(200)
  @SessionRoute()
  @BrowserMutation()
  @CartCommand()
  @LineParam()
  @ApiBody({ type: CartLineVersionsDto })
  @ApiOperation({
    operationId: 'cartLineSaveForLater',
    summary: 'Move a cart line to saved-for-later',
    description: `${CART_OWNER} ${VERSIONS} Saved lines keep their identity and quantity and are excluded from shop groups and subtotals.`,
  })
  @ApiOkResponse({ type: CartDto })
  @AdminErrors(LINE_ERRORS)
  @RateLimit(...WRITE_LIMITS)
  async save(
    @Req() request: AuthRequest,
    @Res({ passthrough: true }) response: Response,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(CartLineParamsSchema)) params: CartLineParams,
    @Body(new InputPipe(CartLineVersionsSchema)) input: CartLineVersions,
  ) {
    return this.respond(request, response, (actor) => this.lines.saveForLater(actor, params.lineId, input));
  }

  @Post(':lineId/restore')
  @HttpCode(200)
  @SessionRoute()
  @BrowserMutation()
  @CartCommand()
  @LineParam()
  @ApiBody({ type: CartLineVersionsDto })
  @ApiOperation({
    operationId: 'cartLineRestore',
    summary: 'Restore a saved-for-later line to the cart',
    description: `${CART_OWNER} ${VERSIONS} Revalidates availability, the label and shared product stock.`,
  })
  @ApiOkResponse({ type: CartDto })
  @AdminErrors({
    ...LINE_ERRORS,
    422: 'CART_LINE_INVALID when the product is unavailable, its label is missing/inactive or the shared stock cannot cover the line.',
  })
  @RateLimit(...WRITE_LIMITS)
  async restore(
    @Req() request: AuthRequest,
    @Res({ passthrough: true }) response: Response,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(CartLineParamsSchema)) params: CartLineParams,
    @Body(new InputPipe(CartLineVersionsSchema)) input: CartLineVersions,
  ) {
    return this.respond(request, response, (actor) => this.lines.restore(actor, params.lineId, input));
  }

  /** A successful guest command slides the cookie lifetime with the row. */
  private async respond(
    request: AuthRequest,
    response: Response,
    run: (actor: CartActor) => Promise<Cart>,
  ): Promise<Cart> {
    const raw = this.cookie.read(request);
    const cart = await run(cartActor(request, raw));
    if (!request.principal && typeof raw === 'string' && this.guest.ttlSeconds !== null)
      this.cookie.set(response, raw, this.guest.ttlSeconds);
    return cart;
  }
}
