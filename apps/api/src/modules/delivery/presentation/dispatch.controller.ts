import { Body, Controller, Get, HttpCode, Param, Post, Query, Req } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import {
  DeliveryAssignSchema,
  DeliveryDispatchStateSchema,
  DeliveryOrderParamsSchema,
  DeliveryRequestSchema,
  RiderCandidatePageSchema,
  type DeliveryAssign,
  type DeliveryOrderParams,
  type DeliveryRequest,
} from '@apnatown/shared/delivery';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { OwnAccount, type AuthRequest } from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors } from '../../admin/presentation/admin.dto';
import { BusinessKindHeader, IdempotencyKey } from '../../businesses/presentation/business.dto';
import { OwnerDispatchService } from '../application/owner-dispatch.service';
import { deliveryCommand } from './delivery-command';

class DeliveryRequestDto extends createZodDto(DeliveryRequestSchema) {}
class DeliveryAssignDto extends createZodDto(DeliveryAssignSchema) {}
class DeliveryDispatchStateDto extends createZodDto(DeliveryDispatchStateSchema) {}
class RiderCandidatePageDto extends createZodDto(RiderCandidatePageSchema) {}

const LIMIT = { key: 'delivery.dispatch', maximumHits: 60, windowSeconds: 60, subject: 'principal' } as const;
const ORDER_ID = { name: 'orderId', schema: { type: 'string', format: 'uuid' } } as const;
const KEY = 'Case-sensitive key; retry the identical command within 24 hours to replay its (re-read) result.';
const OWNER =
  "Approved owner of the order's vendor/provider business (live seller role); delivery mode, apna_town_rider method, status ready. private, no-store.";
const COMMON = {
  401: 'SESSION_EXPIRED without a signed-in session.',
  403: 'CSRF_INVALID for a missing Origin/CSRF token.',
  404: 'ORDER_NOT_FOUND unless the caller owns the order (no existence oracle).',
  429: 'COMMON_RATE_LIMITED with Retry-After.',
  503: 'DELIVERY_EARNING_POLICY_UNAVAILABLE when rider_earning is not configured; MAINTENANCE; COMMON_UNAVAILABLE.',
} as const;

/** Owner rider dispatch for ready platform-rider orders (F-VD-008, S-VEND-04). */
@ApiTags('delivery')
@PrivateApi()
@OwnAccount()
@Controller('delivery/orders')
export class DispatchController {
  constructor(private readonly dispatch: OwnerDispatchService) {}

  @Post(':orderId/request')
  @HttpCode(200)
  @BrowserMutation()
  @BusinessKindHeader()
  @IdempotencyKey(KEY)
  @ApiParam(ORDER_ID)
  @ApiBody({ type: DeliveryRequestDto })
  @ApiOperation({
    operationId: 'deliveryRequestRider',
    summary: 'Request (or re-request) an ApnaTown rider',
    description: `{expectedOrderVersion}. Ensures the order's single delivery job (never a duplicate) and runs auto-assignment: one 60 s offer to the nearest eligible approved/online/idle rider of the shop's city who has not had this job's offer. A live offer is left running; an unassigned/expired one is re-offered; none available -> assignmentState unassigned. Returns {orderId,orderVersion,delivery}. ${OWNER}`,
  })
  @ApiOkResponse({ type: DeliveryDispatchStateDto })
  @AdminErrors({
    ...COMMON,
    400: 'VALIDATION_ERROR for unexpected fields; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    409: 'DELIVERY_INVALID_TRANSITION unless a ready apna_town_rider delivery order; DELIVERY_VERSION_CONFLICT for a stale expectedOrderVersion; DELIVERY_DISTANCE_UNAVAILABLE without shop/drop location; COMMON_CONFLICT for key reuse.',
  })
  @RateLimit(LIMIT)
  request(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(DeliveryOrderParamsSchema)) params: DeliveryOrderParams,
    @Body(new InputPipe(DeliveryRequestSchema)) input: DeliveryRequest,
  ) {
    return this.dispatch.request(deliveryCommand(request), params.orderId, input);
  }

  @Get(':orderId/riders')
  @BusinessKindHeader()
  @ApiParam(ORDER_ID)
  @ApiOperation({
    operationId: 'deliveryRiderCandidates',
    summary: 'Eligible riders for a ready order',
    description: `Approved online riders of the job's (shop's) city, nearest first (≤ 50; nextCursor always null). available=false with unavailableReason busy|pending_offer|declined; availability is rechecked on assign. No phone, KYC or payout data. ${OWNER}`,
  })
  @ApiOkResponse({ type: RiderCandidatePageDto })
  @AdminErrors({
    ...COMMON,
    400: 'VALIDATION_ERROR for a malformed orderId or any query parameter.',
    409: 'DELIVERY_INVALID_TRANSITION unless a ready apna_town_rider delivery order.',
  })
  @RateLimit(LIMIT)
  riders(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(DeliveryOrderParamsSchema)) params: DeliveryOrderParams,
  ) {
    return this.dispatch.riders(deliveryCommand(request), params.orderId);
  }

  @Post(':orderId/assign')
  @HttpCode(200)
  @BrowserMutation()
  @BusinessKindHeader()
  @IdempotencyKey(KEY)
  @ApiParam(ORDER_ID)
  @ApiBody({ type: DeliveryAssignDto })
  @ApiOperation({
    operationId: 'deliveryAssignRider',
    summary: 'Offer the order to a chosen rider',
    description: `{riderUserId,expectedOrderVersion,expectedJobVersion?} (omit expectedJobVersion only when no job exists). Before pickup only: revokes any live offer and sends a directed 60 s offer to that rider, who still accepts; on reject/expiry auto-assignment continues. ${OWNER}`,
  })
  @ApiOkResponse({ type: DeliveryDispatchStateDto })
  @AdminErrors({
    ...COMMON,
    400: 'VALIDATION_ERROR for unexpected fields; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    403: 'RIDER_NOT_APPROVED when the rider is not a currently approved rider; CSRF_INVALID.',
    409: 'DELIVERY_INVALID_TRANSITION (not ready / already accepted); DELIVERY_VERSION_CONFLICT; RIDER_NOT_ONLINE; RIDER_HAS_ACTIVE_JOB; RIDER_UNAVAILABLE (other city, pending offer elsewhere, or already offered this job); DELIVERY_DISTANCE_UNAVAILABLE; COMMON_CONFLICT for key reuse.',
  })
  @RateLimit(LIMIT)
  assign(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(DeliveryOrderParamsSchema)) params: DeliveryOrderParams,
    @Body(new InputPipe(DeliveryAssignSchema)) input: DeliveryAssign,
  ) {
    return this.dispatch.assign(deliveryCommand(request), params.orderId, input);
  }
}
