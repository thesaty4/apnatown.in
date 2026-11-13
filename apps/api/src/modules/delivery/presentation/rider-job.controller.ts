import { Body, Controller, HttpCode, Param, Post, Query, Req } from '@nestjs/common';
import { ApiBody, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import {
  DeliveryJobParamsSchema,
  DeliveryOfferParamsSchema,
  DeliveryOfferRespondSchema,
  HandoverResultSchema,
  RiderJobCompleteSchema,
  RiderJobEventInputSchema,
  RiderJobEventResultSchema,
  type DeliveryJobParams,
  type DeliveryOfferParams,
  type DeliveryOfferRespond,
  type RiderJobComplete,
  type RiderJobEventInput,
} from '@apnatown/shared/delivery';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { Roles, type AuthRequest } from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors } from '../../admin/presentation/admin.dto';
import { IdempotencyKey } from '../../businesses/presentation/business.dto';
import { RiderJobCompleteService } from '../application/rider-job-complete.service';
import { RiderJobProgressService } from '../application/rider-job-progress.service';
import { RiderOfferService } from '../application/rider-offer.service';
import { deliveryCommand } from './delivery-command';
import { KEY, NOT_ADMITTED, RiderJobDto } from './rider.dto';

class DeliveryOfferRespondDto extends createZodDto(DeliveryOfferRespondSchema) {}
class RiderJobEventInputDto extends createZodDto(RiderJobEventInputSchema) {}
class RiderJobEventResultDto extends createZodDto(RiderJobEventResultSchema) {}
class RiderJobCompleteDto extends createZodDto(RiderJobCompleteSchema) {}
class RiderHandoverResultDto extends createZodDto(HandoverResultSchema) {}

const LIMIT = { key: 'delivery.rider.job', maximumHits: 60, windowSeconds: 60, subject: 'principal' } as const;
const OFFER_ID = { name: 'offerId', schema: { type: 'string', format: 'uuid' } } as const;
const JOB_ID = { name: 'jobId', schema: { type: 'string', format: 'uuid' } } as const;
const RIDER = 'COMMON_FORBIDDEN without the live rider role; RIDER_NOT_APPROVED unless currently approved; CSRF_INVALID.';
const BAD = 'VALIDATION_ERROR for unexpected/invalid fields; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.';
const COMMON = { 401: 'SESSION_EXPIRED.', 403: RIDER, 429: 'COMMON_RATE_LIMITED with Retry-After.', 503: NOT_ADMITTED } as const;

/** Rider offer responses and job progress (F-RD-003/004, BR-05/06). */
@ApiTags('delivery')
@PrivateApi()
@Roles('rider')
@Controller('delivery')
export class RiderJobController {
  constructor(
    private readonly offers: RiderOfferService,
    private readonly progress: RiderJobProgressService,
    private readonly completion: RiderJobCompleteService,
  ) {}

  @Post('offers/:offerId/accept')
  @HttpCode(200)
  @BrowserMutation()
  @IdempotencyKey(KEY)
  @ApiParam(OFFER_ID)
  @ApiBody({ type: DeliveryOfferRespondDto })
  @ApiOperation({
    operationId: 'riderAcceptOffer',
    summary: 'Accept the current delivery request',
    description:
      '{expectedVersion}. Own live offer, approved online idle rider of the job city, before expiresAt; atomically assigns the job (status accepted) and returns RiderJobDTO with the drop address. private, no-store.',
  })
  @ApiOkResponse({ type: RiderJobDto })
  @AdminErrors({
    ...COMMON,
    400: BAD,
    404: 'DELIVERY_JOB_NOT_FOUND for a missing or foreign offer.',
    409: 'DELIVERY_OFFER_EXPIRED; DELIVERY_OFFER_TAKEN (responded/revoked/order no longer ready); DELIVERY_VERSION_CONFLICT; RIDER_NOT_ONLINE; RIDER_HAS_ACTIVE_JOB; RIDER_UNAVAILABLE (other city); COMMON_CONFLICT for key reuse.',
  })
  @RateLimit(LIMIT)
  accept(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(DeliveryOfferParamsSchema)) params: DeliveryOfferParams,
    @Body(new InputPipe(DeliveryOfferRespondSchema)) input: DeliveryOfferRespond,
  ) {
    return this.offers.accept(deliveryCommand(request), params.offerId, input);
  }

  @Post('offers/:offerId/reject')
  @HttpCode(204)
  @BrowserMutation()
  @IdempotencyKey(KEY)
  @ApiParam(OFFER_ID)
  @ApiBody({ type: DeliveryOfferRespondDto })
  @ApiOperation({
    operationId: 'riderRejectOffer',
    summary: 'Reject the current delivery request',
    description:
      '{expectedVersion}. Own live offer; the job is offered to the next eligible rider (this rider is not offered it again) or becomes unassigned. private, no-store.',
  })
  @ApiNoContentResponse({ description: 'Offer rejected.' })
  @AdminErrors({
    ...COMMON,
    400: BAD,
    404: 'DELIVERY_JOB_NOT_FOUND for a missing or foreign offer.',
    409: 'DELIVERY_OFFER_EXPIRED; DELIVERY_OFFER_TAKEN; DELIVERY_VERSION_CONFLICT; COMMON_CONFLICT for key reuse.',
  })
  @RateLimit(LIMIT)
  async reject(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(DeliveryOfferParamsSchema)) params: DeliveryOfferParams,
    @Body(new InputPipe(DeliveryOfferRespondSchema)) input: DeliveryOfferRespond,
  ): Promise<void> {
    await this.offers.reject(deliveryCommand(request), params.offerId, input);
  }

  @Post('jobs/:jobId/events')
  @HttpCode(200)
  @BrowserMutation()
  @IdempotencyKey(KEY)
  @ApiParam(JOB_ID)
  @ApiBody({ type: RiderJobEventInputDto })
  @ApiOperation({
    operationId: 'riderJobEvent',
    summary: 'Report job progress',
    description:
      "{event:reached_shop|picked_up|reached_drop|fail,failReason?,expectedVersion,expectedOrderVersion,expectedFinancialVersion?,checkedItemIds?}. accepted→reached_shop→picked_up→reached_drop; fail (failReason required) from any active step cancels the order (after pickup stock stays held). picked_up requires the order ready and checkedItemIds = every current available item ID; it moves the order to out_for_delivery and issues the customer's delivery OTP. job is null once terminal. private, no-store.",
  })
  @ApiOkResponse({ type: RiderJobEventResultDto })
  @AdminErrors({
    ...COMMON,
    400: BAD,
    404: 'DELIVERY_JOB_NOT_FOUND unless the caller is the assigned rider.',
    409: 'DELIVERY_INVALID_TRANSITION; DELIVERY_VERSION_CONFLICT; DELIVERY_ITEMS_CHANGED for a stale/incomplete checklist; ORDERS_INVALID_TRANSITION; COMMON_CONFLICT for key reuse.',
  })
  @RateLimit(LIMIT)
  event(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(DeliveryJobParamsSchema)) params: DeliveryJobParams,
    @Body(new InputPipe(RiderJobEventInputSchema)) input: RiderJobEventInput,
  ) {
    return this.progress.record(deliveryCommand(request), params.jobId, input);
  }

  @Post('jobs/:jobId/complete')
  @HttpCode(200)
  @BrowserMutation()
  @IdempotencyKey(`${KEY} A wrong-code rejection replays without counting another attempt.`)
  @ApiParam(JOB_ID)
  @ApiBody({ type: RiderJobCompleteDto })
  @ApiOperation({
    operationId: 'riderJobComplete',
    summary: "Complete delivery with the customer's OTP",
    description:
      '{otp,codeVersion,cashCollected,expectedVersion,expectedOrderVersion,expectedFinancialVersion?}. Job reached_drop and order out_for_delivery; codeVersion comes from RiderJobDTO.handover. cashCollected must be true while COD is outstanding. Consumes the code, delivers the order, records cash and the earned snapshot atomically. Never returns the code or address. private, no-store.',
  })
  @ApiOkResponse({ type: RiderHandoverResultDto })
  @AdminErrors({
    ...COMMON,
    400: BAD,
    404: 'DELIVERY_JOB_NOT_FOUND unless the caller is the assigned rider.',
    409: 'DELIVERY_INVALID_TRANSITION; DELIVERY_VERSION_CONFLICT; DELIVERY_CODE_NOT_READY / DELIVERY_CODE_EXPIRED / DELIVERY_CODE_CONSUMED; COMMON_CONFLICT for key reuse.',
    422: 'DELIVERY_CODE_INVALID (attempt counted); DELIVERY_COD_NOT_CONFIRMED.',
    423: 'DELIVERY_CODE_LOCKED after 5 wrong attempts.',
    503: `DELIVERY_EARNING_POLICY_UNAVAILABLE; ${NOT_ADMITTED}`,
  })
  @RateLimit(LIMIT)
  complete(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(DeliveryJobParamsSchema)) params: DeliveryJobParams,
    @Body(new InputPipe(RiderJobCompleteSchema)) input: RiderJobComplete,
  ) {
    return this.completion.complete(deliveryCommand(request), params.jobId, input);
  }
}
