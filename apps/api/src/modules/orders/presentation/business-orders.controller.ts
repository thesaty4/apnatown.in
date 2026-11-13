import { Controller, Get, Header, Query, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BusinessOrdersQuerySchema, type BusinessOrdersQuery } from '@apnatown/shared/orders';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { OwnAccount, type AuthRequest } from '../../../shared/auth';
import { PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors } from '../../admin/presentation/admin.dto';
import { BusinessKindHeader } from '../../businesses/presentation/business.dto';
import { OrderReadService } from '../application/order-read.service';
import {
  BusinessOrderCountsDto,
  BusinessOrderPageDto,
  BusinessOrdersQueryDto,
  NOT_ADMITTED,
  ORDER_READ_LIMIT,
  SELLER_FORBIDDEN,
  orderRequest,
} from './orders.dto';

const OWNER =
  "Authenticated owner of an APPROVED vendor/provider business with its live seller role, resolved server-side (X-Business-Kind selects between the caller's own businesses). Providers see their product orders. private, no-store.";
const ERRORS = {
  401: 'SESSION_EXPIRED without a signed-in session.',
  403: SELLER_FORBIDDEN,
  422: 'BUSINESS_CONTEXT_REQUIRED when the caller owns both kinds and sent no X-Business-Kind.',
  429: 'COMMON_RATE_LIMITED with Retry-After.',
  503: NOT_ADMITTED,
} as const;

/** Owner order queues (F-VD-008, F-PV-005; S-VEND-03, S-PROV-04). */
@ApiTags('orders')
@PrivateApi()
@OwnAccount()
@Controller('businesses')
export class BusinessOrdersController {
  constructor(private readonly reads: OrderReadService) {}

  @Get('me/orders/counts')
  @Header('Cache-Control', 'private, no-store')
  @BusinessKindHeader()
  @ApiOperation({
    operationId: 'businessMeOrderCounts',
    summary: "Counts for the owner's five order tabs",
    description: `BusinessOrderCountsDTO {asOf,new,inProgress,readyOut,completed,cancelled}: new=placed; inProgress=accepted+preparing; readyOut=ready+out_for_delivery; completed=delivered+picked_up; cancelled=cancelled+refunded. ${OWNER}`,
  })
  @ApiOkResponse({ type: BusinessOrderCountsDto })
  @AdminErrors({ 400: 'VALIDATION_ERROR for any query parameter or an invalid X-Business-Kind.', ...ERRORS })
  @RateLimit(ORDER_READ_LIMIT)
  counts(@Req() request: AuthRequest, @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>) {
    return this.reads.businessCounts(orderRequest(request));
  }

  @Get('me/orders')
  @Header('Cache-Control', 'private, no-store')
  @BusinessKindHeader()
  @ApiQuery({ type: BusinessOrdersQueryDto })
  @ApiOperation({
    operationId: 'businessMeOrders',
    summary: "The owner's order queue",
    description: `?tab=new|in_progress|ready_out|completed|cancelled (default new), ?cursor, ?limit (1–50). Newest first; returns {items,counts,nextCursor,asOf} where counts share the list's ownership predicate. Cards carry the customer's first name only. ${OWNER}`,
  })
  @ApiOkResponse({ type: BusinessOrderPageDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an unknown tab/limit/parameter, invalid X-Business-Kind, or a cursor bound to another business/tab.',
    ...ERRORS,
  })
  @RateLimit(ORDER_READ_LIMIT)
  list(@Req() request: AuthRequest, @Query(new InputPipe(BusinessOrdersQuerySchema)) query: BusinessOrdersQuery) {
    return this.reads.businessPage(orderRequest(request), query);
  }
}
