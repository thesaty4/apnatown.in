import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import {
  EnquiryCreateSchema,
  EnquiryCreatedSchema,
  EnquiryDetailSchema,
  EnquiryInboxPageSchema,
  EnquiryInboxQuerySchema,
  EnquiryParamsSchema,
  EnquiryServiceParamsSchema,
  EnquiryStatusCommandSchema,
  EnquiryStatusResultSchema,
  type EnquiryCreate,
  type EnquiryInboxQuery,
  type EnquiryParams,
  type EnquiryServiceParams,
  type EnquiryStatusCommand,
} from '@apnatown/shared/services';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import {
  OwnAccount,
  SessionRoute,
  sessionBinding,
  type AuthRequest,
} from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { DomainError } from '../../../shared/errors/errors';
import { currentCorrelationId } from '../../../shared/logger/context';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors } from '../../admin/presentation/admin.dto';
import {
  BusinessKindHeader,
  businessKind,
} from '../../businesses/presentation/business.dto';
import { EnquiryCreateService } from '../application/enquiry-create.service';
import { EnquiryInboxService } from '../application/enquiry-inbox.service';
import type { EnquiryOwnerRequest } from '../application/enquiry-owner-access';

export class EnquiryCreateDto extends createZodDto(EnquiryCreateSchema) {}
export class EnquiryCreatedDto extends createZodDto(EnquiryCreatedSchema) {}
export class EnquiryInboxPageDto extends createZodDto(EnquiryInboxPageSchema) {}
export class EnquiryInboxQueryDto extends createZodDto(
  EnquiryInboxQuerySchema,
) {}
export class EnquiryDetailDto extends createZodDto(EnquiryDetailSchema) {}
export class EnquiryStatusCommandDto extends createZodDto(
  EnquiryStatusCommandSchema,
) {}
export class EnquiryStatusResultDto extends createZodDto(
  EnquiryStatusResultSchema,
) {}

// TODO(verify): the spec says "rate-limited" without numbers.
const CREATE_LIMIT = {
  key: 'services.enquiries.create',
  maximumHits: 10,
  windowSeconds: 3600,
} as const;
const READ_LIMIT = {
  key: 'services.enquiries.read',
  maximumHits: 60,
  windowSeconds: 60,
  subject: 'principal',
} as const;
const WRITE_LIMIT = {
  key: 'services.enquiries.write',
  maximumHits: 30,
  windowSeconds: 60,
  subject: 'principal',
} as const;

const OWNER =
  "Authenticated vendor/provider owner; the business is resolved server-side from the session (X-Business-Kind only selects between the caller's own businesses) and must hold the live matching seller role. private, no-store.";
const FORBIDDEN =
  'COMMON_FORBIDDEN when the caller owns no business of the requested kind, lacks the live seller role, or for a deleted/inactive account.';
const NOT_ADMITTED =
  'MAINTENANCE while maintenance mode is on; COMMON_UNAVAILABLE when the store is unavailable.';
const ENQUIRY_ID = {
  name: 'enquiryId',
  schema: { type: 'string', format: 'uuid' },
} as const;

function enquiryOwner(request: AuthRequest): EnquiryOwnerRequest {
  if (!request.principal) throw new DomainError('SESSION_EXPIRED');
  return {
    session: sessionBinding(request),
    actorId: request.principal.userId,
    ...businessKind(request),
  };
}

function correlation(): string {
  const correlationId = currentCorrelationId();
  if (!correlationId) throw new Error('MISSING_CORRELATION_CONTEXT');
  return correlationId;
}

/** Public enquiry intake (F-SV-005; S-CUST-08). Guests allowed. */
@ApiTags('services')
@Controller('services')
export class EnquiryPublicController {
  constructor(private readonly enquiries: EnquiryCreateService) {}

  @Post(':serviceId/enquiries')
  @HttpCode(201)
  @SessionRoute()
  @BrowserMutation()
  @ApiSecurity('sessionCookie')
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description:
      'Case-sensitive key; retry the identical enquiry within 24 hours to replay the created result.',
    schema: {
      type: 'string',
      minLength: 1,
      maxLength: 128,
      pattern: '^[A-Za-z0-9._:-]+$',
    },
  })
  @ApiParam({ name: 'serviceId', schema: { type: 'string', format: 'uuid' } })
  @ApiBody({ type: EnquiryCreateDto })
  @ApiOperation({
    operationId: 'serviceEnquiryCreate',
    summary: 'Send an enquiry for a service',
    description:
      'Guest (anonymous browser session) or signed-in customer. {name (trimmed 2–60), phone (10-digit Indian mobile, optional +91/0 prefix), message (trimmed 1–1000 plain text), preferredDate? (YYYY-MM-DD, not before today in IST)}. The service must be active and its business approved and publicly visible. The phone is stored encrypted and is never returned; the enquiry and its id-only outbox event commit together before 201 {enquiryId,status:"new"}. No booking, payment or availability promise.',
  })
  @ApiCreatedResponse({ type: EnquiryCreatedDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for invalid fields, a past preferredDate or unexpected keys; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    401: 'SESSION_EXPIRED when a signed-in session ended mid-request.',
    403: 'CSRF_INVALID for a missing session, Origin or CSRF token.',
    404: 'COMMON_NOT_FOUND unless the service is active under an approved public business.',
    409: 'Idempotency-Key reused with a different enquiry, or the original request is still in progress.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(
    { ...CREATE_LIMIT, subject: 'session' },
    {
      ...CREATE_LIMIT,
      key: 'services.enquiries.create.ip',
      maximumHits: 30,
      subject: 'ip',
    },
  )
  create(
    @Req() request: AuthRequest,
    @Param(new InputPipe(EnquiryServiceParamsSchema))
    params: EnquiryServiceParams,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(EnquiryCreateSchema)) input: EnquiryCreate,
  ) {
    return this.enquiries.create(
      {
        session: sessionBinding(request),
        principalId: request.principal?.userId ?? null,
        correlationId: correlation(),
        key: request.headers['idempotency-key'],
      },
      params.serviceId,
      input,
    );
  }
}

/**
 * Owner enquiry inbox (F-VD-016, F-PV-004; S-VEND-07, S-PROV-04). Static
 * `me/...` routes; `me` is a reserved business slug.
 */
@ApiTags('services')
@PrivateApi()
@OwnAccount()
@Controller('businesses')
export class EnquiryOwnerController {
  constructor(private readonly enquiries: EnquiryInboxService) {}

  @Get('me/enquiries')
  @Header('Cache-Control', 'private, no-store')
  @BusinessKindHeader()
  @ApiOperation({
    operationId: 'businessMeEnquiries',
    summary: "The caller's enquiry inbox",
    description: `Newest first, keyset-paginated. ?status=new|contacted|converted|closed, ?query= (name/message contains, 1–100), ?cursor=, ?limit=. Returns {items,nextCursor,statusCounts}; statusCounts honour query but not status. Items never include the phone. ${OWNER}`,
  })
  @ApiQuery({ type: EnquiryInboxQueryDto })
  @ApiOkResponse({ type: EnquiryInboxPageDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for invalid filters/unexpected parameters or X-Business-Kind; COMMON_VALIDATION_FAILED for a cursor from another filter, scope or business.',
    403: FORBIDDEN,
    422: 'BUSINESS_CONTEXT_REQUIRED when the caller owns both kinds and sent no X-Business-Kind.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(READ_LIMIT)
  inbox(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EnquiryInboxQuerySchema)) query: EnquiryInboxQuery,
  ) {
    return this.enquiries.inbox(enquiryOwner(request), query);
  }

  @Get('me/enquiries/:enquiryId')
  @Header('Cache-Control', 'private, no-store')
  @BusinessKindHeader()
  @ApiParam(ENQUIRY_ID)
  @ApiOperation({
    operationId: 'businessMeEnquiry',
    summary: 'One enquiry of the caller',
    description: `Detail with the decrypted phone (E.164 +91) for user-initiated call/WhatsApp links, plus allowedStatuses. Another business's enquiry is COMMON_NOT_FOUND. ${OWNER}`,
  })
  @ApiOkResponse({ type: EnquiryDetailDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an invalid id or unexpected parameters.',
    403: FORBIDDEN,
    404: 'COMMON_NOT_FOUND for a missing enquiry or one of another business.',
    422: 'BUSINESS_CONTEXT_REQUIRED when the caller owns both kinds and sent no X-Business-Kind.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(READ_LIMIT)
  detail(
    @Req() request: AuthRequest,
    @Param(new InputPipe(EnquiryParamsSchema)) params: EnquiryParams,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
  ) {
    return this.enquiries.detail(enquiryOwner(request), params.enquiryId);
  }

  @Patch('me/enquiries/:enquiryId/status')
  @Header('Cache-Control', 'private, no-store')
  @BrowserMutation()
  @BusinessKindHeader()
  @ApiParam(ENQUIRY_ID)
  @ApiBody({ type: EnquiryStatusCommandDto })
  @ApiOperation({
    operationId: 'businessMeEnquiryStatus',
    summary: 'Move an enquiry along ST-enquiry',
    description: `{status,expectedVersion}. Allowed edges: new→contacted, contacted→converted|closed; converted/closed are terminal and convertedAt is set once. Returns the incremented version. ${OWNER}`,
  })
  @ApiOkResponse({ type: EnquiryStatusResultDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an invalid id, status, version or unexpected keys.',
    403: FORBIDDEN,
    404: 'COMMON_NOT_FOUND for a missing enquiry or one of another business.',
    409: 'SERVICES_VERSION_CONFLICT for a stale expectedVersion; SERVICES_INVALID_TRANSITION for an edge outside ST-enquiry.',
    422: 'BUSINESS_CONTEXT_REQUIRED when the caller owns both kinds and sent no X-Business-Kind.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(WRITE_LIMIT)
  changeStatus(
    @Req() request: AuthRequest,
    @Param(new InputPipe(EnquiryParamsSchema)) params: EnquiryParams,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(EnquiryStatusCommandSchema))
    input: EnquiryStatusCommand,
  ) {
    return this.enquiries.transition(
      { ...enquiryOwner(request), correlationId: correlation() },
      params.enquiryId,
      input,
    );
  }
}
