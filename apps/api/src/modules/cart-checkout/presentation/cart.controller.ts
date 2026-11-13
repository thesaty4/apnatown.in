import { Body, Controller, Get, HttpCode, Post, Query, Req, Res } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { OwnAccount, SessionRoute, type AuthRequest } from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors } from '../../admin/presentation/admin.dto';
import { EmptyDto } from '../../auth/presentation/dto';
import { CartMergeService } from '../application/cart-merge.service';
import { CartReadService } from '../application/cart-read.service';
import { GuestCartCapability } from '../application/guest-cart-capability';
import {
  CART_OWNER,
  COMMON_ERRORS,
  CartCommand,
  CartDto,
  CartMergeResultDto,
  MERGE_LIMITS,
  READ_LIMITS,
  cartActor,
} from './cart.dto';
import { GuestCartCookie } from './guest-cart.cookie';

/** Cart read and guest merge (F-CK-001, S-CUST-10, J12). */
@ApiTags('cart')
@PrivateApi()
@Controller('cart')
export class CartController {
  constructor(
    private readonly reads: CartReadService,
    private readonly merges: CartMergeService,
    private readonly guest: GuestCartCapability,
    private readonly cookie: GuestCartCookie,
  ) {}

  @Get()
  @SessionRoute()
  @ApiSecurity('sessionCookie')
  @ApiOperation({
    operationId: 'cartGet',
    summary: 'Read the caller’s cart',
    description: `${CART_OWNER} Lines are revalidated on every read against current public product price, active labels and shared product stock (issues: PRODUCT_UNAVAILABLE, OUT_OF_STOCK, QUANTITY_EXCEEDS_STOCK, VARIANT_SELECTION_REQUIRED, VARIANT_UNAVAILABLE) and grouped by shop with an estimated items subtotal and delivery-minimum shortfall. Before a cart exists the response is the unpersisted {id:null,version:0,lines:[],groups:[]} state. Fees, coupon and payable totals are quote-only (estimatedAmounts.totals="quote_required"). For guests this bootstraps the httpOnly guest-cart cookie (Set-Cookie) without creating a cart row, and rotates an expired one.`,
  })
  @ApiOkResponse({ type: CartDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for unexpected query parameters.',
    403: 'CSRF_INVALID without a live session cookie.',
    429: COMMON_ERRORS[429],
    503: COMMON_ERRORS[503],
  })
  @RateLimit(...READ_LIMITS)
  async read(
    @Req() request: AuthRequest,
    @Res({ passthrough: true }) response: Response,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
  ) {
    const result = await this.reads.read({
      principalId: request.principal?.userId ?? null,
      guestCookie: this.cookie.read(request),
    });
    if (result.issueGuestToken && this.guest.ttlSeconds !== null)
      this.cookie.set(response, result.issueGuestToken, this.guest.ttlSeconds);
    return result.cart;
  }

  @Post('merge-guest')
  @HttpCode(200)
  @OwnAccount()
  @BrowserMutation()
  @CartCommand()
  @ApiBody({ type: EmptyDto, required: false })
  @ApiOperation({
    operationId: 'cartMergeGuest',
    summary: 'Merge the guest cart into the account cart after login',
    description:
      'Signed-in customer plus the independent httpOnly guest-cart cookie; no cart ID is accepted. Locks both carts and merges lines by (productId,variantId), summing quantities up to 10 (active wins over saved-for-later). Returns the account cart plus `review` lines that were clipped (QUANTITY_CLIPPED), not merged (LINE_LIMIT_REACHED) or need attention (line issue codes). The guest cart is consumed in the same transaction and its cookie cleared only after that commit (not on a replay). A same-key retry reauthorizes the account owner and replays the recorded result, even after the guest cart is gone.',
  })
  @ApiOkResponse({ type: CartMergeResultDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for any body field or query parameter; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    401: 'SESSION_EXPIRED without a signed-in session.',
    403: COMMON_ERRORS[403],
    404: 'CART_NOT_FOUND when no live guest cart is bound to the cookie.',
    409: 'CART_VERSION_CONFLICT when a concurrent first account-cart creation won; COMMON_CONFLICT for a reused key with a different request or one still in progress.',
    429: COMMON_ERRORS[429],
    503: COMMON_ERRORS[503],
  })
  @RateLimit(...MERGE_LIMITS)
  async merge(
    @Req() request: AuthRequest,
    @Res({ passthrough: true }) response: Response,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(EmptyRequestSchema.default({}))) _input: Record<string, never>,
  ) {
    const { result, consumed } = await this.merges.merge(
      cartActor(request, this.cookie.read(request)),
    );
    // Reached only after commit; a replay leaves any newer guest cookie alone.
    if (consumed) this.cookie.clear(response);
    return result;
  }
}
