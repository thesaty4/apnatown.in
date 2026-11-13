import { Body, Controller, Get, Header, HttpCode, Param, Post, Query, Req } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import {
  DeliveryCodeReissueSchema,
  DeliveryCodeSchema,
  DeliveryOrderParamsSchema,
  HandoverResultSchema,
  PickupVerifySchema,
  SelfCompleteSchema,
  SelfDispatchResultSchema,
  SelfDispatchSchema,
  type DeliveryCodeReissue,
  type DeliveryOrderParams,
  type PickupVerify,
  type SelfComplete,
  type SelfDispatch,
} from '@apnatown/shared/delivery';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { OwnAccount, sessionBinding, type AuthRequest } from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { DomainError } from '../../../shared/errors/errors';
import { currentCorrelationId } from '../../../shared/logger/context';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors } from '../../admin/presentation/admin.dto';
import { BusinessKindHeader, IdempotencyKey, businessKind } from '../../businesses/presentation/business.dto';
import { CustomerCodeService } from '../application/customer-code.service';
import type { HandoverCommand } from '../application/handover-support';
import { HandoverService } from '../application/handover.service';

class DeliveryCodeDto extends createZodDto(DeliveryCodeSchema) {}
class DeliveryCodeReissueDto extends createZodDto(DeliveryCodeReissueSchema) {}
class SelfDispatchDto extends createZodDto(SelfDispatchSchema) {}
class SelfDispatchResultDto extends createZodDto(SelfDispatchResultSchema) {}
class SelfCompleteDto extends createZodDto(SelfCompleteSchema) {}
class PickupVerifyDto extends createZodDto(PickupVerifySchema) {}
class HandoverResultDto extends createZodDto(HandoverResultSchema) {}

// TODO(verify): G-16 code-channel rate limits are unresolved; conservative local values.
const CODE_LIMIT = { key: 'delivery.code.read', maximumHits: 30, windowSeconds: 60, subject: 'principal' } as const;
const HANDOVER_LIMIT = { key: 'delivery.handover', maximumHits: 30, windowSeconds: 60, subject: 'principal' } as const;
const ORDER_ID = { name: 'orderId', schema: { type: 'string', format: 'uuid' } } as const;
const KEY = 'Case-sensitive key; retry the identical command within 24 hours to replay its result (a wrong-code rejection replays without counting another attempt).';
const OWNER = "Approved owner of the order's vendor/provider business (live seller role); no rider/admin access. private, no-store.";
const COMMON = {
  401: 'SESSION_EXPIRED without a signed-in session.',
  403: 'CSRF_INVALID for a missing Origin/CSRF token.',
  404: 'ORDER_NOT_FOUND unless the caller is authorized for this order (no existence oracle).',
  429: 'COMMON_RATE_LIMITED with Retry-After.',
  503: 'MAINTENANCE while maintenance mode is on; COMMON_UNAVAILABLE when the store is unavailable.',
} as const;
const CODE_409 =
  'DELIVERY_INVALID_TRANSITION for the wrong mode/method/status; ORDERS_RIDER_DISPATCH_UNAVAILABLE for apna_town_rider orders; DELIVERY_VERSION_CONFLICT for a stale order/financial/code version; DELIVERY_CODE_NOT_READY / DELIVERY_CODE_EXPIRED / DELIVERY_CODE_CONSUMED; COMMON_CONFLICT for key reuse.';

function command(request: AuthRequest): HandoverCommand {
  const correlationId = currentCorrelationId();
  if (!request.principal) throw new DomainError('SESSION_EXPIRED');
  if (!correlationId) throw new Error('MISSING_CORRELATION_CONTEXT');
  return {
    session: sessionBinding(request),
    actorId: request.principal.userId,
    ...businessKind(request),
    correlationId,
    key: request.headers['idempotency-key'],
  };
}

/** Customer code channel + jobless self-delivery/pickup handover (BR-05). */
@ApiTags('delivery')
@PrivateApi()
@OwnAccount()
@Controller('delivery')
export class HandoverController {
  constructor(
    private readonly codes: CustomerCodeService,
    private readonly handovers: HandoverService,
  ) {}

  @Get('orders/:orderId/code')
  @Header('Cache-Control', 'private, no-store')
  @ApiParam(ORDER_ID)
  @ApiOperation({
    operationId: 'deliveryOrderCode',
    summary: "The customer's current handover code",
    description:
      "Order's customer only. Returns the live 4-digit pickup code (pickup order ready) or delivery OTP (self-delivery out_for_delivery) with codeVersion/expiry; repeat reads return the same generation and never create or reset a code. Share it only at handover. private, no-store.",
  })
  @ApiOkResponse({ type: DeliveryCodeDto })
  @AdminErrors({
    ...COMMON,
    400: 'VALIDATION_ERROR for a malformed orderId or any query parameter.',
    409: 'DELIVERY_CODE_NOT_READY before a code is issued; DELIVERY_CODE_EXPIRED (reissue); DELIVERY_CODE_CONSUMED after handover.',
    423: 'DELIVERY_CODE_LOCKED after 5 wrong attempts.',
  })
  @RateLimit(CODE_LIMIT)
  code(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(DeliveryOrderParamsSchema)) params: DeliveryOrderParams,
  ) {
    return this.codes.read(command(request), params.orderId);
  }

  @Post('orders/:orderId/code/reissue')
  @HttpCode(200)
  @BrowserMutation()
  @IdempotencyKey(KEY)
  @ApiParam(ORDER_ID)
  @ApiBody({ type: DeliveryCodeReissueDto })
  @ApiOperation({
    operationId: 'deliveryOrderCodeReissue',
    summary: 'Reissue the customer handover code',
    description:
      "{expectedCodeVersion}. Order's customer only, while the code is the live handover proof and after the reissue cooldown (local default 60 s, TODO(verify) G-16). Invalidates the previous generation and returns the new code. A locked code cannot be reset. private, no-store.",
  })
  @ApiOkResponse({ type: DeliveryCodeDto })
  @AdminErrors({
    ...COMMON,
    400: 'VALIDATION_ERROR for unexpected fields; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    409: 'DELIVERY_INVALID_TRANSITION when the order is not awaiting handover; DELIVERY_CODE_NOT_READY; DELIVERY_VERSION_CONFLICT for a stale expectedCodeVersion; COMMON_CONFLICT for key reuse.',
    423: 'DELIVERY_CODE_LOCKED after 5 wrong attempts.',
    429: 'DELIVERY_CODE_COOLDOWN before reissueAvailableAt; COMMON_RATE_LIMITED with Retry-After.',
  })
  @RateLimit(HANDOVER_LIMIT)
  reissue(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(DeliveryOrderParamsSchema)) params: DeliveryOrderParams,
    @Body(new InputPipe(DeliveryCodeReissueSchema)) input: DeliveryCodeReissue,
  ) {
    return this.codes.reissue(command(request), params.orderId, input);
  }

  @Post('orders/:orderId/self-dispatch')
  @HttpCode(200)
  @BrowserMutation()
  @BusinessKindHeader()
  @IdempotencyKey(KEY)
  @ApiParam(ORDER_ID)
  @ApiBody({ type: SelfDispatchDto })
  @ApiOperation({
    operationId: 'deliverySelfDispatch',
    summary: 'Owner dispatches a self-delivery order',
    description: `{expectedOrderVersion}. Delivery mode, delivery method self, status ready → out_for_delivery; issues the customer's delivery OTP; no rider job. ${OWNER}`,
  })
  @ApiOkResponse({ type: SelfDispatchResultDto })
  @AdminErrors({
    ...COMMON,
    400: 'VALIDATION_ERROR for unexpected fields; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    409: CODE_409,
  })
  @RateLimit(HANDOVER_LIMIT)
  selfDispatch(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(DeliveryOrderParamsSchema)) params: DeliveryOrderParams,
    @Body(new InputPipe(SelfDispatchSchema)) input: SelfDispatch,
  ) {
    return this.handovers.selfDispatch(command(request), params.orderId, input);
  }

  @Post('orders/:orderId/self-complete')
  @HttpCode(200)
  @BrowserMutation()
  @BusinessKindHeader()
  @IdempotencyKey(KEY)
  @ApiParam(ORDER_ID)
  @ApiBody({ type: SelfCompleteDto })
  @ApiOperation({
    operationId: 'deliverySelfComplete',
    summary: 'Owner completes a self-delivery with the customer OTP',
    description: `{code,codeVersion,cashCollected,expectedOrderVersion,expectedFinancialVersion?}. out_for_delivery → delivered. cashCollected must be true while cash is outstanding (COD); the code is consumed, the order delivered and the cash collection recorded atomically. ${OWNER}`,
  })
  @ApiOkResponse({ type: HandoverResultDto })
  @AdminErrors({
    ...COMMON,
    400: 'VALIDATION_ERROR for a non-4-digit code or unexpected fields; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    409: CODE_409,
    422: 'DELIVERY_CODE_INVALID for a wrong code (attempt counted); DELIVERY_COD_NOT_CONFIRMED when cash is outstanding and cashCollected is false.',
    423: 'DELIVERY_CODE_LOCKED after 5 wrong attempts.',
  })
  @RateLimit(HANDOVER_LIMIT)
  selfComplete(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(DeliveryOrderParamsSchema)) params: DeliveryOrderParams,
    @Body(new InputPipe(SelfCompleteSchema)) input: SelfComplete,
  ) {
    return this.handovers.selfComplete(command(request), params.orderId, input);
  }

  @Post('pickup-codes/verify')
  @HttpCode(200)
  @BrowserMutation()
  @BusinessKindHeader()
  @IdempotencyKey(KEY)
  @ApiBody({ type: PickupVerifyDto })
  @ApiOperation({
    operationId: 'deliveryPickupVerify',
    summary: 'Owner verifies the customer pickup code',
    description: `{orderId,code,codeVersion,cashCollected,expectedOrderVersion,expectedFinancialVersion?}. Pickup mode, ready → picked_up; never creates a job. cashCollected must be true while pay-at-pickup cash is outstanding. ${OWNER}`,
  })
  @ApiOkResponse({ type: HandoverResultDto })
  @AdminErrors({
    ...COMMON,
    400: 'VALIDATION_ERROR for a non-4-digit code or unexpected fields; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    409: CODE_409,
    422: 'DELIVERY_CODE_INVALID for a wrong code (attempt counted); DELIVERY_COD_NOT_CONFIRMED when cash is outstanding and cashCollected is false.',
    423: 'DELIVERY_CODE_LOCKED after 5 wrong attempts.',
  })
  @RateLimit(HANDOVER_LIMIT)
  pickupVerify(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(PickupVerifySchema)) input: PickupVerify,
  ) {
    return this.handovers.pickupVerify(command(request), input);
  }
}
