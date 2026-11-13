import { Body, Controller, Get, Header, HttpCode, Param, Post, Query, Req } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import {
  CheckoutAttemptCreateSchema,
  CheckoutAttemptParamsSchema,
  CheckoutAttemptSchema,
  CheckoutQuoteRequestSchema,
  CheckoutQuoteSchema,
  type CheckoutAttemptCreate,
  type CheckoutAttemptParams,
  type CheckoutQuoteRequest,
} from '@apnatown/shared/checkout';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { OwnAccount, type AuthRequest } from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors } from '../../admin/presentation/admin.dto';
import { CheckoutAttemptService } from '../application/checkout-attempt.service';
import { CheckoutQuoteService } from '../application/checkout-quote.service';
import { CartCommand, COMMON_ERRORS, cartActor } from './cart.dto';

class CheckoutQuoteRequestDto extends createZodDto(CheckoutQuoteRequestSchema) {}
class CheckoutQuoteDto extends createZodDto(CheckoutQuoteSchema) {}
class CheckoutAttemptCreateDto extends createZodDto(CheckoutAttemptCreateSchema) {}
class CheckoutAttemptDto extends createZodDto(CheckoutAttemptSchema) {}

// TODO(verify): the spec states no numeric checkout rate limits.
const QUOTE_LIMIT = { key: 'checkout.quote', maximumHits: 60, windowSeconds: 60, subject: 'principal' } as const;
const PLACE_LIMIT = { key: 'checkout.place', maximumHits: 10, windowSeconds: 60, subject: 'principal' } as const;
const READ_LIMIT = { key: 'checkout.read', maximumHits: 120, windowSeconds: 60, subject: 'principal' } as const;
const SIGNED_IN = { ...COMMON_ERRORS, 401: 'SESSION_EXPIRED without a signed-in customer session.' } as const;

/** Server-priced quote (F-CK-002..005, S-CUST-11). */
@ApiTags('checkout')
@PrivateApi()
@OwnAccount()
@Controller('cart')
export class CartQuoteController {
  constructor(private readonly quotes: CheckoutQuoteService) {}

  @Post('quote')
  @HttpCode(200)
  @BrowserMutation()
  @Header('Cache-Control', 'private, no-store')
  @ApiBody({ type: CheckoutQuoteRequestDto })
  @ApiOperation({
    operationId: 'cartQuote',
    summary: 'Quote the signed-in cart per shop',
    description:
      "{cartVersion,addressId?,addressVersion?,deliveryModes?:[{businessId,mode:delivery|pickup}]}. Groups active lines by shop; per shop: current offer-effective prices and shared stock, delivery availability (configured method, radius from the shop to the address point, minimum on the shop subtotal) and pickup availability; fee = 0 for pickup, the shop's flat fee for self-delivery, the Geo zone/default slab for apna_town_rider; platform fee from Settings (0 when unconfigured); integer paise. Unknown fees/totals are null; per-shop issues (MODE_REQUIRED, ADDRESS_REQUIRED, DELIVERY_OUT_OF_RANGE, MINIMUM_ORDER_NOT_MET, PICKUP_UNAVAILABLE, LINE_ISSUES, …) block placement; ready=true only when every shop is placeable, every amount known and cash is enabled. Persisted for 15 minutes; claims no stock. couponCode is rejected until coupons are configured. private, no-store.",
  })
  @ApiOkResponse({ type: CheckoutQuoteDto })
  @AdminErrors({
    ...SIGNED_IN,
    400: 'VALIDATION_ERROR for unexpected fields, an unpaired address id/version or duplicate shop modes.',
    409: 'CART_VERSION_CONFLICT when cartVersion is not the current cart version (or no cart exists); CHECKOUT_COUPON_POLICY_UNAVAILABLE when couponCode is sent.',
    422: 'CHECKOUT_ADDRESS_INVALID for a foreign/deleted address or a stale addressVersion.',
  })
  @RateLimit(QUOTE_LIMIT)
  quote(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(CheckoutQuoteRequestSchema)) input: CheckoutQuoteRequest,
  ) {
    return this.quotes.quote(cartActor(request, undefined), input);
  }
}

/** Checkout placement (F-CK-002/006/007, S-CUST-11/12, BR-03/04). */
@ApiTags('checkout')
@PrivateApi()
@OwnAccount()
@Controller('checkout/attempts')
export class CheckoutAttemptsController {
  constructor(private readonly attempts: CheckoutAttemptService) {}

  @Post()
  @HttpCode(201)
  @BrowserMutation()
  @CartCommand()
  @Header('Cache-Control', 'private, no-store')
  @ApiBody({ type: CheckoutAttemptCreateDto })
  @ApiOperation({
    operationId: 'checkoutAttemptCreate',
    summary: 'Place the quoted checkout (one order per shop)',
    description:
      "{quoteId,expectedCartVersion,expectedAddressVersion?,paymentMethod}. paymentMethod 'cash' = Cash on delivery / pay at pickup (requires the payments_cod flag); upi/card/net_banking/wallet need a payment provider and return CHECKOUT_PAYMENT_UNAVAILABLE. Re-verifies the caller's unexpired ready quote, cart/address versions and an identical recomputation, then atomically reserves stock, creates one order per shop (placed history, purchase snapshots), one pending cash allocation per shop, removes the purchased lines and emits order.created/checkout.orders_created. Any failure creates nothing and keeps the cart. Same key + body replays the recorded attempt.",
  })
  @ApiCreatedResponse({ type: CheckoutAttemptDto })
  @AdminErrors({
    ...SIGNED_IN,
    400: 'VALIDATION_ERROR for unexpected fields or an unknown payment method; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    409: 'CHECKOUT_QUOTE_STALE for a missing/expired/foreign quote, changed cart/address versions or changed prices/fees/settings; PRODUCT_NOT_AVAILABLE when stock/availability changed; CHECKOUT_PAYMENT_UNAVAILABLE for online methods or disabled COD; ORDER_CREATION_CONFLICT; COMMON_CONFLICT for key reuse.',
    422: 'ORDER_CHECKOUT_INVALID when the quote was not ready (resolve its issues and quote again).',
  })
  @RateLimit(PLACE_LIMIT)
  create(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(CheckoutAttemptCreateSchema)) input: CheckoutAttemptCreate,
  ) {
    return this.attempts.create(cartActor(request, undefined), input);
  }

  @Get(':attemptId')
  @Header('Cache-Control', 'private, no-store')
  @ApiParam({ name: 'attemptId', schema: { type: 'string', format: 'uuid' } })
  @ApiOperation({
    operationId: 'checkoutAttemptGet',
    summary: 'Read an own checkout attempt',
    description: "The caller's attempt with its per-shop orders (current status). private, no-store.",
  })
  @ApiOkResponse({ type: CheckoutAttemptDto })
  @AdminErrors({
    ...SIGNED_IN,
    400: 'VALIDATION_ERROR for a malformed attemptId or any query parameter.',
    404: 'CHECKOUT_ATTEMPT_NOT_FOUND unless the attempt belongs to the caller.',
  })
  @RateLimit(READ_LIMIT)
  read(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(CheckoutAttemptParamsSchema)) params: CheckoutAttemptParams,
  ) {
    return this.attempts.read(cartActor(request, undefined), params.attemptId);
  }
}
