import { Controller, Get, Header, Param, Query, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  AdminOrdersQuerySchema,
  OrderParamsSchema,
  type AdminOrdersQuery,
  type OrderParams,
} from '@apnatown/shared/orders';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { adminContext, Permission, Roles, Scoped, type AuthRequest } from '../../../shared/auth';
import { PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors } from '../../admin/presentation/admin.dto';
import { ORDER_SCOPE, OrderAdminReadService } from '../application/order-admin-read.service';
import { AdminOrderPageDto, AdminOrdersQueryDto, NOT_ADMITTED, ORDER_ID, OrderDetailDto } from './orders.dto';

const READ_LIMIT = { key: 'admin.orders.read', maximumHits: 120, windowSeconds: 60, subject: 'principal' } as const;
const FORBIDDEN =
  'COMMON_FORBIDDEN without orders:view or without an active assigned scope; ADMIN_INACTIVE for a deactivated admin.';

/** Read-only scoped admin orders (F-AD-007, S-ADMN-07/08, BR-12). */
@ApiTags('admin')
@PrivateApi()
@Roles('admin', 'super_admin')
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly reads: OrderAdminReadService) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  @Permission('orders', 'view')
  @ApiQuery({ type: AdminOrdersQueryDto })
  @ApiOperation({
    operationId: 'adminOrders',
    summary: 'Scoped admin order list',
    description:
      "Orders whose purchase-time business city/area is inside the caller's assigned scope (super_admin: all), newest first; ?filter=all|active|disputes|refunds|failed (default all; disputes/refunds/failed are empty until cases/refunds/rider jobs ship), ?cursor (bound to caller/filter/scope revision), ?limit <= 50. No address/contact. private, no-store.",
  })
  @ApiOkResponse({ type: AdminOrderPageDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an unknown filter/limit or a foreign cursor.',
    403: FORBIDDEN,
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(READ_LIMIT)
  list(@Req() request: AuthRequest, @Query(new InputPipe(AdminOrdersQuerySchema)) query: AdminOrdersQuery) {
    return this.reads.list(adminContext(request), query);
  }

  @Get(':orderId')
  @Header('Cache-Control', 'private, no-store')
  @Permission('orders', 'view')
  @Scoped(ORDER_SCOPE, 'orderId')
  @ApiParam(ORDER_ID)
  @ApiOperation({
    operationId: 'adminOrderGet',
    summary: 'Scoped admin order detail',
    description:
      "Admin OrderDetailDTO (viewer=admin): items, amounts, payment summary, nonsecret handover metadata and timeline; customer first name only, no address/code. Requires orders:view over the order's city/area. Read only. private, no-store.",
  })
  @ApiOkResponse({ type: OrderDetailDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for a malformed orderId or any query parameter.',
    403: `${FORBIDDEN} ADMIN_SCOPE_FORBIDDEN outside the order's city/area.`,
    404: 'COMMON_NOT_FOUND / ORDER_NOT_FOUND for a missing order.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(READ_LIMIT)
  detail(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(OrderParamsSchema)) params: OrderParams,
  ) {
    return this.reads.detail(adminContext(request), params.orderId);
  }
}
