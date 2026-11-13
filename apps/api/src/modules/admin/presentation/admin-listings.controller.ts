import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  AdminListingCreateSchema,
  AdminListingEditSchema,
  AdminListingParamsSchema,
  AdminListingQuerySchema,
  AdminListingRemoveSchema,
  type AdminListingCreate,
  type AdminListingEdit,
  type AdminListingParams,
  type AdminListingQuery,
  type AdminListingRemove,
} from '@apnatown/shared/admin';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import {
  adminContext,
  Permission,
  Roles,
  Scoped,
  type AuthRequest,
} from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminListingsService } from '../application/admin-listings.service';
import { AdminErrors, adminCommand } from './admin.dto';
import {
  AdminListingCreateDto,
  AdminListingDetailDto,
  AdminListingEditDto,
  AdminListingMutationResultDto,
  AdminListingPageDto,
  AdminListingQueryDto,
  AdminListingRemoveDto,
  CATALOG_EDIT_FORBIDDEN,
  CATALOG_READ_FORBIDDEN,
  listingCommandKey,
  NOT_ADMITTED,
  READ_LIMIT,
  WRITE_LIMIT,
} from './admin-listings.dto';

const TYPE_PARAM = { name: 'type', enum: ['business', 'provider'] } as const;
const ID_PARAM = {
  name: 'id',
  schema: { type: 'string', format: 'uuid' },
} as const;
const MUTATION_ERRORS = {
  400: 'VALIDATION_ERROR for a bad type/id/body (rider is not a listing type until Delivery ships) or unexpected fields; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
  403: CATALOG_EDIT_FORBIDDEN,
  404: 'BUSINESS_NOT_FOUND for a missing, deleted or other-type listing; AREA_NOT_FOUND for an unknown/inactive destination area.',
  409: 'BUSINESS_VERSION_CONFLICT for a stale expectedVersion; BUSINESS_STATE_CONFLICT when ST-approval does not allow statusAction; idempotency conflicts.',
  422: 'ADMIN_SELF_ACTION when the caller owns the listing.',
  429: 'COMMON_RATE_LIMITED with Retry-After.',
  503: NOT_ADMITTED,
} as const;

/** Scoped admin Listings (S-ADMN-03, F-AD-003) over owning-module ports. */
@ApiTags('admin')
@PrivateApi()
@Roles('admin', 'super_admin')
@Controller('admin/listings')
export class AdminListingsController {
  constructor(private readonly listings: AdminListingsService) {}

  @Get()
  @Permission('catalog', 'view')
  @ApiQuery({ type: AdminListingQueryDto })
  @ApiOperation({
    operationId: 'adminListings',
    summary: 'Scoped listings (admin)',
    description:
      'Non-draft business/provider listings inside the caller catalog:view scope (super_admin platform-wide), oldest first (keyset), with open report counts. type=rider returns no items with unavailable:["rider"] until Delivery ships; ratings are null with unavailable:["rating"] until Reviews ships. private, no-store.',
  })
  @ApiOkResponse({ type: AdminListingPageDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an unknown type/status, a bad q or limit, a tampered or foreign cursor, or unexpected fields.',
    403: CATALOG_READ_FORBIDDEN,
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(READ_LIMIT)
  async list(
    @Req() request: AuthRequest,
    @Query(new InputPipe(AdminListingQuerySchema)) query: AdminListingQuery,
  ) {
    return this.listings.list(adminContext(request), query);
  }

  @Post()
  @HttpCode(200)
  @Permission('catalog', 'edit')
  @BrowserMutation()
  @listingCommandKey()
  @ApiBody({ type: AdminListingCreateDto })
  @ApiOperation({
    operationId: 'adminListingCreate',
    summary: 'Create a listing (admin) - blocked by ADM-Q1',
    description:
      'Admin-created listing ownership/claim policy (ADM-Q1) is unresolved: after catalog:edit over the destination area, always fails with ADMIN_CREATION_POLICY_REQUIRED and creates nothing.',
  })
  @ApiOkResponse({ type: AdminListingMutationResultDto })
  @AdminErrors({
    ...MUTATION_ERRORS,
    404: 'AREA_NOT_FOUND for an unknown or inactive destination area.',
    409: 'ADMIN_CREATION_POLICY_REQUIRED (always, until ADM-Q1 is decided).',
  })
  @RateLimit(WRITE_LIMIT)
  async create(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(AdminListingCreateSchema)) input: AdminListingCreate,
  ): Promise<never> {
    return this.listings.create(adminCommand(request), input);
  }

  @Get(':type/:id')
  @Permission('catalog', 'view')
  @Scoped('business.listing')
  @ApiParam(TYPE_PARAM)
  @ApiParam(ID_PARAM)
  @ApiOperation({
    operationId: 'adminListingDetail',
    summary: 'Listing detail (admin)',
    description:
      'Full listing (contact, owner, status, version), open reports (reporter masked, newest 20) and permission-aware allowedActions (edit/remove with catalog:edit; ST-approval actions also need approvals:edit; none on a listing the caller owns). Scope rechecked in the transaction. private, no-store.',
  })
  @ApiOkResponse({ type: AdminListingDetailDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for a bad type/id (rider is not a listing type until Delivery ships) or unexpected query fields.',
    403: `${CATALOG_READ_FORBIDDEN} ADMIN_SCOPE_FORBIDDEN or BUSINESS_SCOPE_DENIED outside the listing scope.`,
    404: 'COMMON_NOT_FOUND for a missing, deleted or other-type listing.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    503: NOT_ADMITTED,
  })
  @RateLimit(READ_LIMIT)
  async detail(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(AdminListingParamsSchema)) params: AdminListingParams,
  ) {
    return this.listings.detail(adminContext(request), params);
  }

  @Patch(':type/:id')
  @Permission('catalog', 'edit')
  @Scoped('business.listing')
  @BrowserMutation()
  @listingCommandKey()
  @ApiParam(TYPE_PARAM)
  @ApiParam(ID_PARAM)
  @ApiBody({ type: AdminListingEditDto })
  @ApiOperation({
    operationId: 'adminListingEdit',
    summary: 'Edit a listing (admin)',
    description:
      'Versioned Businesses command: nameEn/nameHi/phoneE164/areaId and/or statusAction (ST-approval edge; needs approvals:edit; reject/request_changes need note). catalog:edit over source AND destination areas is rechecked in the transaction. Profile change, audit before/after and outbox events commit atomically. private, no-store.',
  })
  @ApiOkResponse({ type: AdminListingMutationResultDto })
  @AdminErrors(MUTATION_ERRORS)
  @RateLimit(WRITE_LIMIT)
  async update(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(AdminListingParamsSchema)) params: AdminListingParams,
    @Body(new InputPipe(AdminListingEditSchema)) input: AdminListingEdit,
  ) {
    return this.listings.update(adminCommand(request), params, input);
  }

  @Delete(':type/:id')
  @HttpCode(200)
  @Permission('catalog', 'edit')
  @Scoped('business.listing')
  @BrowserMutation()
  @listingCommandKey()
  @ApiParam(TYPE_PARAM)
  @ApiParam(ID_PARAM)
  @ApiBody({ type: AdminListingRemoveDto })
  @ApiOperation({
    operationId: 'adminListingRemove',
    summary: 'Remove a listing (admin)',
    description:
      'Versioned Businesses soft delete {expectedVersion, note?}: hides the listing publicly and stops new selling; history is retained. catalog:edit over the stored area rechecked in the transaction; audit before/after and outbox event commit atomically. private, no-store.',
  })
  @ApiOkResponse({ type: AdminListingMutationResultDto })
  @AdminErrors({
    ...MUTATION_ERRORS,
    404: 'BUSINESS_NOT_FOUND for a missing, deleted or other-type listing.',
    409: 'BUSINESS_VERSION_CONFLICT for a stale expectedVersion; idempotency conflicts.',
  })
  @RateLimit(WRITE_LIMIT)
  async remove(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(AdminListingParamsSchema)) params: AdminListingParams,
    @Body(new InputPipe(AdminListingRemoveSchema)) input: AdminListingRemove,
  ) {
    return this.listings.remove(adminCommand(request), params, input);
  }
}
