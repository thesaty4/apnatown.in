import {
  Body,
  Controller,
  Delete,
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
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import {
  ServiceOwnerCreateSchema,
  ServiceOwnerDeleteSchema,
  ServiceOwnerDeletedSchema,
  ServiceOwnerListQuerySchema,
  ServiceOwnerPageSchema,
  ServiceOwnerParamsSchema,
  ServiceOwnerPatchSchema,
  ServiceOwnerSchema,
  type ServiceOwnerCreate,
  type ServiceOwnerDelete,
  type ServiceOwnerListQuery,
  type ServiceOwnerParams,
  type ServiceOwnerPatch,
} from '@apnatown/shared/services';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import {
  OwnAccount,
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
  IdempotencyKey,
  businessKind,
} from '../../businesses/presentation/business.dto';
import type { EnquiryOwnerRequest } from '../application/enquiry-owner-access';
import { ServiceOwnerService } from '../application/service-owner.service';
import { ServiceOwnerWriteService } from '../application/service-owner-write.service';
import type { ServiceOwnerCommand } from '../application/service-owner-write-support';

export class ServiceOwnerDto extends createZodDto(ServiceOwnerSchema) {}
export class ServiceOwnerPageDto extends createZodDto(ServiceOwnerPageSchema) {}
export class ServiceOwnerListQueryDto extends createZodDto(
  ServiceOwnerListQuerySchema,
) {}
export class ServiceOwnerCreateDto extends createZodDto(
  ServiceOwnerCreateSchema,
) {}
export class ServiceOwnerPatchDto extends createZodDto(
  ServiceOwnerPatchSchema,
) {}
export class ServiceOwnerDeleteDto extends createZodDto(
  ServiceOwnerDeleteSchema,
) {}
export class ServiceOwnerDeletedDto extends createZodDto(
  ServiceOwnerDeletedSchema,
) {}

// TODO(verify): the spec states no numeric limits for the manager.
const READ_LIMIT = {
  key: 'services.owner.read',
  maximumHits: 60,
  windowSeconds: 60,
  subject: 'principal',
} as const;
const WRITE_LIMIT = {
  key: 'services.owner.write',
  maximumHits: 30,
  windowSeconds: 60,
  subject: 'principal',
} as const;

const OWNER =
  "Authenticated vendor/provider owner; the business is resolved server-side from the session (X-Business-Kind only selects between the caller's own businesses) and must hold the live matching seller role. private, no-store.";
const WRITER = `${OWNER} Writes additionally require an APPROVED business; another business's service is COMMON_NOT_FOUND.`;
const FORBIDDEN =
  'COMMON_FORBIDDEN when the caller owns no business of the requested kind, lacks the live seller role, or for a deleted/inactive account.';
const NOT_ADMITTED =
  'MAINTENANCE while maintenance mode is on; COMMON_UNAVAILABLE when the store is unavailable.';
const CONTEXT =
  'BUSINESS_CONTEXT_REQUIRED when the caller owns both kinds and sent no X-Business-Kind.';
const KEY =
  'Case-sensitive key; retry the identical command within 24 hours to replay the original result.';
const SERVICE_ID = {
  name: 'serviceId',
  schema: { type: 'string', format: 'uuid' },
} as const;
const FIELDS =
  "nameEn/nameHi trimmed 2–60 plain text; categoryId an active service-kind category and subcategoryId one active subcategory under it; priceType from|fixed|range|enquiry with integer paise (enquiry: no amounts; from/fixed: priceFromPaise only; range: both with priceToPaise ≥ priceFromPaise); unit hour|day|event|sq_ft|unit|visit|plate|month; included/excluded ≤20 lines; media ≤5 ordered {assetId,showInGallery?} of the caller's ready `service` images (showInGallery defaults false).";

function owner(request: AuthRequest): EnquiryOwnerRequest {
  if (!request.principal) throw new DomainError('SESSION_EXPIRED');
  return {
    session: sessionBinding(request),
    actorId: request.principal.userId,
    ...businessKind(request),
  };
}

function command(request: AuthRequest): ServiceOwnerCommand {
  const correlationId = currentCorrelationId();
  if (!correlationId) throw new Error('MISSING_CORRELATION_CONTEXT');
  return {
    ...owner(request),
    correlationId,
    key: request.headers['idempotency-key'],
  };
}

/**
 * Owner service manager (F-VD-014, F-PV-003; S-VEND-13, S-PROV-08). Static
 * `me/...` routes; `me` is a reserved business slug.
 */
@ApiTags('services')
@PrivateApi()
@OwnAccount()
@Controller('businesses')
export class ServiceOwnerController {
  constructor(
    private readonly reads: ServiceOwnerService,
    private readonly writes: ServiceOwnerWriteService,
  ) {}

  @Get('me/services')
  @Header('Cache-Control', 'private, no-store')
  @BusinessKindHeader()
  @ApiOperation({
    operationId: 'businessMeServices',
    summary: "The caller's services",
    description: `Non-deleted services, newest first, keyset-paginated. ?status=active|paused, ?cursor=, ?limit= (1–50, default 20). Returns {items,nextCursor}. ${OWNER}`,
  })
  @ApiQuery({ type: ServiceOwnerListQueryDto })
  @ApiOkResponse({ type: ServiceOwnerPageDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for invalid filters/unexpected parameters or X-Business-Kind; COMMON_VALIDATION_FAILED for a cursor from another filter or business.',
    403: FORBIDDEN,
    422: CONTEXT,
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(READ_LIMIT)
  list(
    @Req() request: AuthRequest,
    @Query(new InputPipe(ServiceOwnerListQuerySchema))
    query: ServiceOwnerListQuery,
  ) {
    return this.reads.list(owner(request), query);
  }

  @Post('me/services')
  @HttpCode(201)
  @Header('Cache-Control', 'private, no-store')
  @BrowserMutation()
  @BusinessKindHeader()
  @IdempotencyKey(KEY)
  @ApiBody({ type: ServiceOwnerCreateDto })
  @ApiOperation({
    operationId: 'businessMeServiceCreate',
    summary: 'Create a service listing',
    description: `${FIELDS} status defaults active; galleryVisible defaults to the business Gallery setting; featuredSelected=true needs current Premium entitlement. The slug is allocated once and stays stable. ${WRITER}`,
  })
  @ApiCreatedResponse({ type: ServiceOwnerDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for invalid fields or unexpected keys; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    403: `USERS_APPROVAL_REQUIRED when the business is not approved; ${FORBIDDEN}`,
    409: 'FEATURED_ENTITLEMENT_UNAVAILABLE without current Premium entitlement; Idempotency-Key reused with a different body or still in progress.',
    422: `SERVICES_INVALID for a price-type/amount mismatch, an invalid category or unusable media (details.field); SERVICES_SUBCATEGORY_REQUIRED when the subcategory is not active under the category; ${CONTEXT}`,
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(WRITE_LIMIT)
  create(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(ServiceOwnerCreateSchema)) input: ServiceOwnerCreate,
  ) {
    return this.writes.create(command(request), input);
  }

  @Get('me/services/:serviceId')
  @Header('Cache-Control', 'private, no-store')
  @BusinessKindHeader()
  @ApiParam(SERVICE_ID)
  @ApiOperation({
    operationId: 'businessMeService',
    summary: 'One service of the caller',
    description: `Owner DTO with version for PATCH/DELETE. Another business's or a deleted service is COMMON_NOT_FOUND. ${OWNER}`,
  })
  @ApiOkResponse({ type: ServiceOwnerDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an invalid id or unexpected parameters.',
    403: FORBIDDEN,
    404: 'COMMON_NOT_FOUND for a missing/deleted service or one of another business.',
    422: CONTEXT,
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(READ_LIMIT)
  detail(
    @Req() request: AuthRequest,
    @Param(new InputPipe(ServiceOwnerParamsSchema)) params: ServiceOwnerParams,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
  ) {
    return this.reads.detail(owner(request), params.serviceId);
  }

  @Patch('me/services/:serviceId')
  @Header('Cache-Control', 'private, no-store')
  @BrowserMutation()
  @BusinessKindHeader()
  @IdempotencyKey(KEY)
  @ApiParam(SERVICE_ID)
  @ApiBody({ type: ServiceOwnerPatchDto })
  @ApiOperation({
    operationId: 'businessMeServiceUpdate',
    summary: 'Update a service listing',
    description: `Any subset of the create fields (null clears an optional field; media replaces the ordered list) plus expectedVersion. ${FIELDS} status moves only active→paused or paused→active. A NEW featured selection needs current Premium entitlement; an existing selection is retained. ${WRITER}`,
  })
  @ApiOkResponse({ type: ServiceOwnerDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for invalid fields, no changes or unexpected keys; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    403: `${FORBIDDEN} Also when the business is not approved.`,
    404: 'COMMON_NOT_FOUND for a missing/deleted service or one of another business.',
    409: 'SERVICES_VERSION_CONFLICT for a stale expectedVersion; SERVICES_INVALID_TRANSITION for a status edge outside active↔paused; FEATURED_ENTITLEMENT_UNAVAILABLE for a new selection without Premium; Idempotency-Key conflicts.',
    422: `SERVICES_INVALID / SERVICES_SUBCATEGORY_REQUIRED as for create; ${CONTEXT}`,
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(WRITE_LIMIT)
  update(
    @Req() request: AuthRequest,
    @Param(new InputPipe(ServiceOwnerParamsSchema)) params: ServiceOwnerParams,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(ServiceOwnerPatchSchema)) input: ServiceOwnerPatch,
  ) {
    return this.writes.update(command(request), params.serviceId, input);
  }

  @Delete('me/services/:serviceId')
  @Header('Cache-Control', 'private, no-store')
  @BrowserMutation()
  @BusinessKindHeader()
  @IdempotencyKey(KEY)
  @ApiParam(SERVICE_ID)
  @ApiBody({ type: ServiceOwnerDeleteDto })
  @ApiOperation({
    operationId: 'businessMeServiceDelete',
    summary: 'Soft-delete a service listing',
    description: `{expectedVersion}. The listing leaves the manager and public surfaces; its slug stays reserved. Returns {id,version,deleted:true}. ${WRITER}`,
  })
  @ApiOkResponse({ type: ServiceOwnerDeletedDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an invalid id/version or unexpected keys; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    403: `${FORBIDDEN} Also when the business is not approved.`,
    404: 'COMMON_NOT_FOUND for a missing/deleted service or one of another business.',
    409: 'SERVICES_VERSION_CONFLICT for a stale expectedVersion; Idempotency-Key conflicts.',
    422: CONTEXT,
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(WRITE_LIMIT)
  remove(
    @Req() request: AuthRequest,
    @Param(new InputPipe(ServiceOwnerParamsSchema)) params: ServiceOwnerParams,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(ServiceOwnerDeleteSchema)) input: ServiceOwnerDelete,
  ) {
    return this.writes.remove(command(request), params.serviceId, input);
  }
}
