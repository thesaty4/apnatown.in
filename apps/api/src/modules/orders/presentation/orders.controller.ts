import { Body, Controller, Get, Header, HttpCode, Param, Post, Query, Req } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  CustomerOrdersQuerySchema,
  OrderCancelSchema,
  OrderParamsSchema,
  OrderTransitionSchema,
  type CustomerOrdersQuery,
  type OrderCancel,
  type OrderParams,
  type OrderTransition,
} from '@apnatown/shared/orders';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { OwnAccount, type AuthRequest } from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors } from '../../admin/presentation/admin.dto';
import { BusinessKindHeader, IdempotencyKey } from '../../businesses/presentation/business.dto';
import { OrderCommandsService } from '../application/order-commands.service';
import { OrderReadService } from '../application/order-read.service';
import {
  CustomerOrderPageDto,
  CustomerOrdersQueryDto,
  NOT_ADMITTED,
  ORDER_ID,
  ORDER_READ_LIMIT,
  ORDER_WRITE_LIMIT,
  OrderCancelDto,
  OrderDetailDto,
  OrderTransitionDto,
  SELLER_FORBIDDEN,
  orderCommand,
  orderRequest,
} from './orders.dto';

const KEY = 'Case-sensitive key; retry the identical command within 24 hours. Replay reauthorizes the caller and returns the current order view.';
const COMMAND_409 =
  'ORDERS_INVALID_TRANSITION when the state machine (mode/status/actor) does not allow the event; ORDER_VERSION_CONFLICT for a stale expectedVersion; COMMON_CONFLICT for a reused key with a different body or one still in progress.';

/** Customer order history/detail and order lifecycle commands (F-OR-001..006, F-VD-008). */
@ApiTags('orders')
@PrivateApi()
@OwnAccount()
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly reads: OrderReadService,
    private readonly commands: OrderCommandsService,
  ) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  @ApiQuery({ type: CustomerOrdersQueryDto })
  @ApiOperation({
    operationId: 'ordersList',
    summary: "The signed-in customer's orders",
    description:
      'Own orders only, newest first. ?group=active|completed|cancelled (default active: placed..out_for_delivery; completed: delivered/picked_up; cancelled: cancelled/refunded), ?cursor, ?limit (1–50, default 20). Returns {items,counts:{active,completed,cancelled},nextCursor,asOf}; counts use the same owner predicate before pagination. private, no-store.',
  })
  @ApiOkResponse({ type: CustomerOrderPageDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an unknown group/limit/parameter or a cursor bound to another caller/group.',
    401: 'SESSION_EXPIRED without a signed-in session.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(ORDER_READ_LIMIT)
  list(@Req() request: AuthRequest, @Query(new InputPipe(CustomerOrdersQuerySchema)) query: CustomerOrdersQuery) {
    return this.reads.customerPage(orderRequest(request), query);
  }

  @Get(':orderId')
  @Header('Cache-Control', 'private, no-store')
  @BusinessKindHeader()
  @ApiParam(ORDER_ID)
  @ApiOperation({
    operationId: 'orderGet',
    summary: 'Order detail (customer or owning business)',
    description:
      "Role-minimized OrderDetailDTO. The order's customer gets the customer view (own delivery address, no customer block); the owner of the order's APPROVED vendor/provider business gets the business view (customer first name, delivery address for delivery orders). Send X-Business-Kind to request the business view when the caller is also the customer. Items/amounts are immutable purchase snapshots; payment is the Payments summary (method cash = Cash on delivery / pay at pickup); handover is nonsecret code metadata — the code itself is only at GET /delivery/orders/{orderId}/code. allowedActions are server-derived. Admins use GET /admin/orders/{orderId}. private, no-store.",
  })
  @ApiOkResponse({ type: OrderDetailDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for a malformed orderId, X-Business-Kind or any query parameter.',
    401: 'SESSION_EXPIRED without a signed-in session.',
    404: 'ORDER_NOT_FOUND for a missing order or one the caller neither placed nor owns (no existence oracle).',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(ORDER_READ_LIMIT)
  detail(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(OrderParamsSchema)) params: OrderParams,
  ) {
    return this.reads.detail(orderRequest(request), params.orderId);
  }

  @Post(':orderId/cancel')
  @HttpCode(200)
  @BrowserMutation()
  @IdempotencyKey(KEY)
  @ApiParam(ORDER_ID)
  @ApiBody({ type: OrderCancelDto })
  @ApiOperation({
    operationId: 'orderCancel',
    summary: 'Customer cancel or owner reject',
    description:
      "{event:'cancel',reasonKey:ordered_by_mistake|found_better_price|delivery_taking_too_long|change_items_or_address|other,expectedVersion} by the order's customer (delivery: placed/accepted/preparing; pickup: placed/accepted), or {event:'reject',reasonKey:item_out_of_stock|shop_closing|too_far_to_deliver|other,expectedVersion} by the approved owning business (placed only). Cancellation releases outstanding stock allocations once, closes the unpaid cash allocation, invalidates handover codes and emits order.status_changed + order.cancelled atomically. Returns the caller's OrderDetailDTO. private, no-store.",
  })
  @ApiOkResponse({ type: OrderDetailDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an unknown event/reason or unexpected fields; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    401: 'SESSION_EXPIRED without a signed-in session.',
    403: 'CSRF_INVALID for a missing Origin/CSRF token.',
    404: 'ORDER_NOT_FOUND unless the caller is the customer (cancel) or the approved owner (reject).',
    409: COMMAND_409,
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(ORDER_WRITE_LIMIT)
  cancel(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(OrderParamsSchema)) params: OrderParams,
    @Body(new InputPipe(OrderCancelSchema)) input: OrderCancel,
  ) {
    return this.commands.cancel(orderCommand(request), params.orderId, input);
  }

  @Post(':orderId/transitions')
  @HttpCode(200)
  @BrowserMutation()
  @IdempotencyKey(KEY)
  @ApiParam(ORDER_ID)
  @ApiBody({ type: OrderTransitionDto })
  @ApiOperation({
    operationId: 'orderTransition',
    summary: 'Owner order progression',
    description:
      "{event:accept|start_preparing|mark_ready,expectedVersion} by the CURRENTLY APPROVED owner of the order's business. Delivery: placed→accepted→preparing→ready; pickup: placed→accepted→ready (mark_ready issues the customer's pickup code). Self-delivery continues with POST /delivery/orders/{orderId}/self-dispatch; pickup completes with POST /delivery/pickup-codes/verify. apna_town_rider mark_ready creates the delivery job and offers it to the nearest eligible rider (DELIVERY_EARNING_POLICY_UNAVAILABLE 503 / DELIVERY_DISTANCE_UNAVAILABLE 409 block it); the rider's job events move the order on. Returns the business OrderDetailDTO. private, no-store.",
  })
  @ApiOkResponse({ type: OrderDetailDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an unknown event or unexpected fields; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    401: 'SESSION_EXPIRED without a signed-in session.',
    403: 'CSRF_INVALID for a missing Origin/CSRF token.',
    404: `ORDER_NOT_FOUND unless the caller is the approved owner of the order's business (${SELLER_FORBIDDEN}).`,
    409: COMMAND_409,
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(ORDER_WRITE_LIMIT)
  transition(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(OrderParamsSchema)) params: OrderParams,
    @Body(new InputPipe(OrderTransitionSchema)) input: OrderTransition,
  ) {
    return this.commands.transition(orderCommand(request), params.orderId, input);
  }
}
