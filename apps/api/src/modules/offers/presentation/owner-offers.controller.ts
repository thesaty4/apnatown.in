import { Body, Controller, Get, Header, Param, Patch, Post, Query, Req } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  OfferCreateSchema,
  OfferStatusCommandSchema,
  OfferUpdateSchema,
  OwnerOfferPageSchema,
  OwnerOfferQuerySchema,
  OwnerOfferSchema,
  type OfferCreate,
  type OfferStatusCommand,
  type OfferUpdate,
  type OwnerOfferQuery,
} from '@apnatown/shared/offers';
import { EmptyRequestSchema, IdSchema } from '@apnatown/shared/wire';
import { createZodDto } from 'nestjs-zod';
import { OwnAccount, type AuthRequest } from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors, adminCommand } from '../../admin/presentation/admin.dto';
import {
  BusinessKindHeader,
  IdempotencyKey,
  businessKind,
  owner,
} from '../../businesses/presentation/business.dto';
import { OwnerOffersService } from '../application/owner-offers.service';

class OwnerOfferQueryDto extends createZodDto(OwnerOfferQuerySchema) {}
class OwnerOfferPageDto extends createZodDto(OwnerOfferPageSchema) {}
class OwnerOfferDto extends createZodDto(OwnerOfferSchema) {}
class OfferCreateDto extends createZodDto(OfferCreateSchema) {}
class OfferUpdateDto extends createZodDto(OfferUpdateSchema) {}
class OfferStatusCommandDto extends createZodDto(OfferStatusCommandSchema) {}

const READ_LIMIT = { key: 'offers.owner.read', maximumHits: 60, windowSeconds: 60, subject: 'principal' } as const;
const WRITE_LIMIT = { key: 'offers.owner.write', maximumHits: 30, windowSeconds: 60, subject: 'principal' } as const;
const OWNER =
  "Owner of an APPROVED vendor/provider business with its live seller role, resolved server-side (X-Business-Kind selects between the caller's own businesses). Business-wide offers only (no product targets/banner yet). private, no-store.";
const ERRORS = {
  401: 'SESSION_EXPIRED without a signed-in session.',
  403: 'COMMON_FORBIDDEN when the caller has no approved selling business.',
  422: 'BUSINESS_CONTEXT_REQUIRED when the caller owns both kinds and sent no X-Business-Kind.',
  429: 'COMMON_RATE_LIMITED with Retry-After.',
} as const;
const offerParam = { name: 'offerId', schema: { type: 'string', format: 'uuid' } } as const;

/** S-VEND-07 owner offers (F-VD-007, F-OF-005). */
@ApiTags('offers')
@PrivateApi()
@OwnAccount()
@Controller('businesses/me/offers')
export class OwnerOffersController {
  constructor(private readonly offers: OwnerOffersService) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  @BusinessKindHeader()
  @ApiQuery({ type: OwnerOfferQueryDto })
  @ApiOperation({
    operationId: 'businessMeOffers',
    summary: "Owner's offers with status filter, counters and allowed actions",
    description: `Newest first; opaque cursor bound to the status filter. ${OWNER}`,
  })
  @ApiOkResponse({ type: OwnerOfferPageDto })
  @AdminErrors({ 400: 'VALIDATION_ERROR for an invalid status/cursor/limit or X-Business-Kind.', ...ERRORS })
  @RateLimit(READ_LIMIT)
  list(
    @Req() request: AuthRequest,
    @Query(new InputPipe(OwnerOfferQuerySchema)) query: OwnerOfferQuery,
  ) {
    return this.offers.page(owner(request), query);
  }

  @Post()
  @BrowserMutation()
  @BusinessKindHeader()
  @IdempotencyKey('Case-sensitive key; retry the identical offer within 24 hours to replay the stored result.')
  @ApiBody({ type: OfferCreateDto })
  @ApiOperation({
    operationId: 'businessMeOfferCreate',
    summary: 'Create an offer (enters pending approval)',
    description: `{titleEn, titleHi, discountType percent|flat|free_delivery, discountPercent|discountPaise, validFrom, validTo}. ${OWNER}`,
  })
  @ApiCreatedResponse({ type: OwnerOfferDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for invalid fields/discount shape/validity; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    409: 'Idempotency conflicts (same key, different payload).',
    ...ERRORS,
  })
  @RateLimit(WRITE_LIMIT)
  create(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(OfferCreateSchema)) input: OfferCreate,
  ) {
    return this.offers.create({ ...adminCommand(request), ...businessKind(request) }, input);
  }

  @Patch(':offerId')
  @BrowserMutation()
  @BusinessKindHeader()
  @ApiParam(offerParam)
  @ApiBody({ type: OfferUpdateDto })
  @ApiOperation({
    operationId: 'businessMeOfferUpdate',
    summary: 'Edit an offer (re-queues approval)',
    description: `Full replacement of editable fields + expectedVersion; the edited offer is not live until approved again. Ended offers cannot be edited. ${OWNER}`,
  })
  @ApiOkResponse({ type: OwnerOfferDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for invalid fields.',
    404: 'OFFER_NOT_FOUND for a foreign or unknown offer.',
    409: 'OFFER_VERSION_CONFLICT for a stale version; OFFER_STATE_INVALID for an ended offer.',
    ...ERRORS,
  })
  @RateLimit(WRITE_LIMIT)
  update(
    @Req() request: AuthRequest,
    @Param('offerId', new InputPipe(IdSchema)) offerId: string,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(OfferUpdateSchema)) input: OfferUpdate,
  ) {
    return this.offers.update(owner(request), offerId, input);
  }

  @Patch(':offerId/status')
  @BrowserMutation()
  @BusinessKindHeader()
  @ApiParam(offerParam)
  @ApiBody({ type: OfferStatusCommandDto })
  @ApiOperation({
    operationId: 'businessMeOfferStatus',
    summary: 'Pause, resume or end an offer',
    description: `{status: paused|active|ended, expectedVersion}. Pause: active only; resume: approved paused offer still in window; end: active/paused, terminal. ${OWNER}`,
  })
  @ApiOkResponse({ type: OwnerOfferDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an unknown status.',
    404: 'OFFER_NOT_FOUND for a foreign or unknown offer.',
    409: 'OFFER_STATE_INVALID for a transition the current state does not allow; OFFER_VERSION_CONFLICT for a stale version.',
    ...ERRORS,
  })
  @RateLimit(WRITE_LIMIT)
  setStatus(
    @Req() request: AuthRequest,
    @Param('offerId', new InputPipe(IdSchema)) offerId: string,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(OfferStatusCommandSchema)) input: OfferStatusCommand,
  ) {
    return this.offers.setStatus(owner(request), offerId, input);
  }
}
