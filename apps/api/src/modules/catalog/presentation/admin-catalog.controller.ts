import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  AdminCategoryTreeSchema,
  AdminSuggestionPageSchema,
  AdminSuggestionQuerySchema,
  DecideSuggestionSchema,
  KeywordMappingPageSchema,
  SuggestionParamsSchema,
  SuggestionSchema,
  type AdminSuggestionQuery,
  type DecideSuggestion,
  type SuggestionParams,
} from '@apnatown/shared/catalog';
import {
  EmptyRequestSchema,
  PageQuerySchema,
  type PageQuery,
} from '@apnatown/shared/wire';
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
import { AdminErrors, adminCommand } from '../../admin/presentation/admin.dto';
import { CatalogKeywordsService } from '../application/catalog-keywords.service';
import { CatalogSuggestionsService } from '../application/catalog-suggestions.service';
import { CatalogTaxonomyService } from '../application/catalog-taxonomy.service';
import {
  AdminCategoryTreeDto,
  AdminSuggestionPageDto,
  AdminSuggestionQueryDto,
  CatalogPageQueryDto,
  DecideSuggestionDto,
  KeywordMappingPageDto,
  SuggestionDto,
} from './catalog.dto';

const READ_LIMIT = {
  key: 'admin.catalog.read',
  maximumHits: 120,
  windowSeconds: 60,
  subject: 'principal',
} as const;
const DECISION_LIMIT = {
  key: 'admin.catalog.decision',
  maximumHits: 60,
  windowSeconds: 60,
  subject: 'principal',
} as const;
const READER =
  'Requires an active admin with catalog:view and an active assigned city/area scope; super_admin is platform-wide. private, no-store.';
const NOT_ADMITTED =
  'MAINTENANCE while maintenance mode is on (admins are not admitted); COMMON_UNAVAILABLE when the store is unavailable.';
const READ_FORBIDDEN =
  'COMMON_FORBIDDEN without catalog:view or without an active assigned scope; ADMIN_INACTIVE for a deactivated admin.';

/** Scoped catalog reads and the area-scoped suggestion decision. */
@ApiTags('admin')
@PrivateApi()
@Roles('admin', 'super_admin')
@Controller('catalog/admin')
export class AdminCatalogController {
  constructor(
    private readonly taxonomy: CatalogTaxonomyService,
    private readonly suggestions: CatalogSuggestionsService,
    private readonly keywords: CatalogKeywordsService,
  ) {}

  @Get('categories')
  @Permission('catalog', 'view')
  @ApiOperation({
    operationId: 'adminCatalogCategories',
    summary: 'Read the full category tree',
    description: `Active and inactive categories with their subcategories, versions and audit timestamps, ordered by kind, sortOrder and name; the taxonomy is platform-wide shared data. ${READER}`,
  })
  @ApiOkResponse({ type: AdminCategoryTreeDto })
  @AdminErrors({ 403: READ_FORBIDDEN, 503: NOT_ADMITTED })
  @RateLimit(READ_LIMIT)
  async categories(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
  ) {
    return AdminCategoryTreeSchema.parse(
      await this.taxonomy.tree(adminContext(request)),
    );
  }

  @Get('subcategory-suggestions')
  @Permission('catalog', 'view')
  @ApiOperation({
    operationId: 'adminCatalogSuggestions',
    summary: 'Scoped subcategory suggestion queue',
    description: `Suggestions whose stored business area is inside the caller's assigned city/area scope (super_admin: all), filtered by the allow-listed status (default pending), oldest first with a caller-bound keyset cursor. Each item carries ranked existing-subcategory duplicate candidates from the same category. No owner contact or documents. ${READER}`,
  })
  @ApiQuery({ type: AdminSuggestionQueryDto })
  @ApiOkResponse({ type: AdminSuggestionPageDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an unknown status, invalid limit or a cursor bound to another caller/filter.',
    403: READ_FORBIDDEN,
    503: NOT_ADMITTED,
  })
  @RateLimit(READ_LIMIT)
  async suggestionQueue(
    @Req() request: AuthRequest,
    @Query(new InputPipe(AdminSuggestionQuerySchema))
    query: AdminSuggestionQuery,
  ) {
    return AdminSuggestionPageSchema.parse(
      await this.suggestions.adminList(adminContext(request), query),
    );
  }

  @Post('subcategory-suggestions/:id/decision')
  @HttpCode(200)
  @Permission('catalog', 'edit')
  @Scoped('catalog.suggestion')
  @BrowserMutation()
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description:
      'Case-sensitive command key. Retry the identical decision within 24 hours to replay the stored result; replay rechecks current admin access.',
    schema: {
      type: 'string',
      minLength: 1,
      maxLength: 128,
      pattern: '^[A-Za-z0-9._:-]+$',
    },
  })
  @ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid' } })
  @ApiBody({ type: DecideSuggestionDto })
  @ApiOperation({
    operationId: 'adminCatalogSuggestionDecision',
    summary: 'Approve, reject or merge a pending suggestion',
    description:
      'Requires an active admin with catalog:edit whose assigned scope contains the suggestion area (rechecked in the transaction); super_admin is platform-wide. approve creates the subcategory under the suggested category (approvalNameHi supplies a missing Hindi name); reject requires a reason; merge links to an active subcategory of the same category. Only pending suggestions transition, guarded by expectedVersion. The decision, any created subcategory, one audit entry and the outbox events (catalog.suggestion.*, catalog.taxonomy.changed) commit atomically. private, no-store.',
  })
  @ApiOkResponse({ type: SuggestionDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an unknown action, a missing reason/target or unexpected fields; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    403: 'COMMON_FORBIDDEN without catalog:edit; ADMIN_SCOPE_FORBIDDEN (route guard) or SUGGESTION_SCOPE_DENIED (transaction recheck) when the suggestion area is outside the assigned scope; ADMIN_INACTIVE for a deactivated admin.',
    404: 'SUGGESTION_NOT_FOUND.',
    409: 'SUGGESTION_STATE_INVALID when no longer pending; SUGGESTION_DUPLICATE when approval would duplicate an existing subcategory; CATALOG_VERSION_CONFLICT for a stale expectedVersion; idempotency conflicts.',
    422: 'SUGGESTION_MERGE_TARGET_INVALID for a missing, inactive or other-category merge target.',
    503: NOT_ADMITTED,
  })
  @RateLimit(DECISION_LIMIT)
  async decide(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(SuggestionParamsSchema)) params: SuggestionParams,
    @Body(new InputPipe(DecideSuggestionSchema)) input: DecideSuggestion,
  ) {
    return SuggestionSchema.parse(
      await this.suggestions.decide(adminCommand(request), params.id, input),
    );
  }

  @Get('keyword-mappings')
  @Permission('catalog', 'view')
  @ApiOperation({
    operationId: 'adminCatalogKeywordMappings',
    summary: 'List search keyword mappings',
    description: `Mappings with their primary term, EN/HI/Hinglish/typo synonyms and typed category/subcategory/product-tag targets, ordered by id with a caller-bound cursor. Mappings are platform-wide; writes are super_admin only until Q-39 is resolved. ${READER}`,
  })
  @ApiQuery({ type: CatalogPageQueryDto })
  @ApiOkResponse({ type: KeywordMappingPageDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an invalid limit or cursor.',
    403: READ_FORBIDDEN,
    503: NOT_ADMITTED,
  })
  @RateLimit(READ_LIMIT)
  async keywordMappings(
    @Req() request: AuthRequest,
    @Query(new InputPipe(PageQuerySchema)) query: PageQuery,
  ) {
    return KeywordMappingPageSchema.parse(
      await this.keywords.list(adminContext(request), query),
    );
  }
}
