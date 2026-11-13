import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { PublicListingParamsSchema } from '@apnatown/shared';
import {
  ProviderExpertiseReplaceSchema,
  ProviderExpertiseSchema,
  PublicProviderExpertiseSchema,
  type ProviderExpertiseReplace,
} from '@apnatown/shared/services';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import {
  OwnAccount,
  PublicRoute,
  sessionBinding,
  type AuthRequest,
} from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { DomainError } from '../../../shared/errors/errors';
import { ErrorDto } from '../../../shared/health/health.controller';
import { currentCorrelationId } from '../../../shared/logger/context';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors } from '../../admin/presentation/admin.dto';
import {
  ProviderExpertiseService,
  type ExpertiseOwnerRequest,
} from '../application/provider-expertise.service';

export class ProviderExpertiseDto extends createZodDto(
  ProviderExpertiseSchema,
) {}
export class ProviderExpertiseReplaceDto extends createZodDto(
  ProviderExpertiseReplaceSchema,
) {}
export class PublicProviderExpertiseDto extends createZodDto(
  PublicProviderExpertiseSchema,
) {}

const READ_LIMIT = {
  key: 'services.expertise.read',
  maximumHits: 60,
  windowSeconds: 60,
  subject: 'principal',
} as const;
const WRITE_LIMIT = {
  key: 'services.expertise.write',
  maximumHits: 30,
  windowSeconds: 60,
  subject: 'principal',
} as const;
const OWNER =
  "Authenticated owner of a PROVIDER business resolved server-side from the session (always the caller's provider business; X-Business-Kind is not used). Allowed for draft/pending/rejected/changes_requested/approved; grants no selling or listing-publication capability. private, no-store.";
const FORBIDDEN =
  'COMMON_FORBIDDEN when the caller owns no provider business (e.g. vendor-only) or it is suspended/inactive, or for a deleted/inactive account.';
const NOT_ADMITTED =
  'MAINTENANCE while maintenance mode is on; COMMON_UNAVAILABLE when the store is unavailable.';

function expertiseOwner(request: AuthRequest): ExpertiseOwnerRequest {
  if (!request.principal) throw new DomainError('SESSION_EXPIRED');
  return {
    session: sessionBinding(request),
    actorId: request.principal.userId,
  };
}

/**
 * Owner provider expertise (F-PV-002; S-PROV-01/09). `me`, `public`,
 * `admin`, `applications` and `expertise` are reserved business slugs
 * (BUSINESS_RESERVED_SLUGS), so `/businesses/{slug}/expertise` cannot shadow
 * these static routes.
 */
@ApiTags('services')
@PrivateApi()
@OwnAccount()
@Controller('businesses')
export class ProviderExpertiseOwnerController {
  constructor(private readonly expertise: ProviderExpertiseService) {}

  @Get('me/expertise')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({
    operationId: 'businessMeExpertise',
    summary: "The caller's provider expertise",
    description: `{subcategoryIds,expertiseVersion}; an empty set starts at version 1. ${OWNER}`,
  })
  @ApiOkResponse({ type: ProviderExpertiseDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for unexpected query parameters.',
    403: FORBIDDEN,
    503: NOT_ADMITTED,
  })
  @RateLimit(READ_LIMIT)
  mine(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
  ) {
    return this.expertise.mine(expertiseOwner(request));
  }

  @Put('me/expertise')
  @Header('Cache-Control', 'private, no-store')
  @BrowserMutation()
  @ApiBody({ type: ProviderExpertiseReplaceDto })
  @ApiOperation({
    operationId: 'businessMeExpertiseReplace',
    summary: "Replace the caller's provider expertise",
    description: `{subcategoryIds[] (≤50, duplicates collapsed),expectedVersion}: replaces the whole set atomically under the locked expertise version and returns the incremented expertiseVersion. Every ID must be an active subcategory of an active service-kind category. The business profile version is not accepted. ${OWNER}`,
  })
  @ApiOkResponse({ type: ProviderExpertiseDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for malformed IDs, more than 50 IDs or unexpected keys.',
    403: FORBIDDEN,
    409: 'SERVICES_VERSION_CONFLICT for a stale expectedVersion.',
    422: 'SERVICES_EXPERTISE_INVALID when an ID is not an active service subcategory.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(WRITE_LIMIT)
  replace(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(ProviderExpertiseReplaceSchema))
    input: ProviderExpertiseReplace,
  ) {
    const correlationId = currentCorrelationId();
    if (!correlationId) throw new Error('MISSING_CORRELATION_CONTEXT');
    return this.expertise.replace(
      { ...expertiseOwner(request), correlationId },
      input,
    );
  }
}

/**
 * Public provider expertise. Registered after the owner controller so the
 * static `me/expertise` route always wins; reserved slugs never resolve.
 */
@ApiTags('services')
@PublicRoute()
@Controller('businesses')
export class ProviderExpertisePublicController {
  constructor(private readonly expertise: ProviderExpertiseService) {}

  @Get(':slug/expertise')
  @Header('Cache-Control', 'private, no-store')
  @RateLimit({
    key: 'services.expertise.public-read',
    subject: 'ip',
    maximumHits: 120,
    windowSeconds: 60,
  })
  @ApiOperation({
    operationId: 'getPublicProviderExpertise',
    summary: 'Public provider expertise for /provider/[slug]',
    description:
      'Active localized service subcategories of an approved public provider; COMMON_NOT_FOUND for any other business or slug.',
  })
  @ApiParam({
    name: 'slug',
    schema: {
      type: 'string',
      pattern: '^[a-z0-9]+(-[a-z0-9]+)*$',
      maxLength: 80,
    },
  })
  @ApiOkResponse({ type: PublicProviderExpertiseDto })
  @ApiResponse({
    status: 400,
    type: ErrorDto,
    description: 'VALIDATION_ERROR for an invalid slug.',
  })
  @ApiResponse({
    status: 404,
    type: ErrorDto,
    description: 'COMMON_NOT_FOUND unless the slug is an approved public provider.',
  })
  publicExpertise(
    @Param(new InputPipe(PublicListingParamsSchema)) params: { slug: string },
  ) {
    return this.expertise.publicBySlug(params.slug);
  }
}
