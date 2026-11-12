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
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  AdminCategorySchema,
  AdminHomeSectionListSchema,
  AdminHomeSectionSchema,
  AdminSubcategorySchema,
  CategoryParamsSchema,
  CreateCategorySchema,
  CreateHomeSectionSchema,
  CreateKeywordMappingSchema,
  CreateSubcategorySchema,
  ExpectedVersionBodySchema,
  HomeSectionParamsSchema,
  HomeSectionRemovedSchema,
  HomeSectionStatusSchema,
  KeywordMappingDeletedSchema,
  KeywordMappingParamsSchema,
  KeywordMappingSchema,
  SubcategoryParamsSchema,
  UpdateCategorySchema,
  UpdateHomeSectionSchema,
  UpdateKeywordMappingSchema,
  UpdateSubcategorySchema,
  type CategoryParams,
  type CreateCategory,
  type CreateHomeSection,
  type CreateKeywordMapping,
  type CreateSubcategory,
  type ExpectedVersionBody,
  type HomeSectionParams,
  type HomeSectionStatus,
  type KeywordMappingParams,
  type SubcategoryParams,
  type UpdateCategory,
  type UpdateHomeSection,
  type UpdateKeywordMapping,
  type UpdateSubcategory,
} from '@apnatown/shared/catalog';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { adminContext, Roles, type AuthRequest } from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { MaintenanceAdmission } from '../../../shared/maintenance/admission';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import {
  AdminErrors,
  IdempotentAdmin,
  adminCommand,
} from '../../admin/presentation/admin.dto';
import { CatalogHomeSectionsService } from '../application/catalog-home-sections.service';
import { CatalogKeywordsService } from '../application/catalog-keywords.service';
import { CatalogTaxonomyService } from '../application/catalog-taxonomy.service';
import {
  AdminCategoryDto,
  AdminHomeSectionDto,
  AdminHomeSectionListDto,
  AdminSubcategoryDto,
  CreateCategoryDto,
  CreateHomeSectionDto,
  CreateKeywordMappingDto,
  CreateSubcategoryDto,
  ExpectedVersionBodyDto,
  HomeSectionRemovedDto,
  HomeSectionStatusDto,
  KeywordMappingDeletedDto,
  KeywordMappingDto,
  UpdateCategoryDto,
  UpdateHomeSectionDto,
  UpdateKeywordMappingDto,
  UpdateSubcategoryDto,
} from './catalog.dto';

const READ_LIMIT = {
  key: 'super-admin.catalog.read',
  maximumHits: 120,
  windowSeconds: 60,
  subject: 'principal',
} as const;
const WRITE_LIMIT = {
  key: 'super-admin.catalog.write',
  maximumHits: 30,
  windowSeconds: 60,
  subject: 'principal',
} as const;
const AUDITED =
  'super_admin only (regular admins are denied, even with catalog:edit); admitted during maintenance for recovery. Rechecks super_admin in the transaction and commits the change, one audit entry (before/after) and its outbox event atomically; a rejected write changes nothing. Same Idempotency-Key and payload replays the stored result.';
const MAINTENANCE_NOTE =
  'MAINTENANCE (errors.system.maintenance) with Retry-After for an authenticated non-super session while maintenance is on; COMMON_UNAVAILABLE when the store is unavailable.';
const IMAGE =
  'imageAssetId must be an owned, ready catalog_taxonomy Media asset; invalid, removed or foreign assets are rejected with CATALOG_IMAGE_INVALID (explicit null removes an image).';
const NAMES =
  'Names are trimmed plain text; duplicate checks use the shared normalization (NFKC, lowercase, whitespace collapse, unaccent) on both EN and HI names.';
const SECTION =
  "Kinds: dedicated_subcategories (one category's active subcategories as tiles, unique per live category) and curated_pills (ordered active categories of one kind with an initial category). Headings/supporting text are localized EN/HI; displayed text is never hardcoded. No scheduling windows.";
const UUID = { type: 'string', format: 'uuid' } as const;

@ApiTags('super-admin')
@PrivateApi()
@Roles('super_admin')
@MaintenanceAdmission('super')
@Controller('catalog/admin')
export class SuperAdminCatalogController {
  constructor(
    private readonly taxonomy: CatalogTaxonomyService,
    private readonly homeSections: CatalogHomeSectionsService,
    private readonly keywords: CatalogKeywordsService,
  ) {}

  // ----- Categories / subcategories ----------------------------------------

  @Post('categories')
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiBody({ type: CreateCategoryDto })
  @ApiOperation({
    operationId: 'superAdminCatalogCategoryCreate',
    summary: 'Create a category',
    description: `Allow-listed {kind,slug,nameEn,nameHi,icon?,imageAssetId?,sortOrder?}. The slug is immutable after creation. Emits catalog.taxonomy.changed. ${NAMES} ${IMAGE} ${AUDITED}`,
  })
  @ApiCreatedResponse({ type: AdminCategoryDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for invalid fields or unexpected keys.',
    409: 'CATEGORY_CONFLICT when the slug already exists; idempotency conflicts.',
    422: 'CATALOG_IMAGE_INVALID.',
    503: MAINTENANCE_NOTE,
  })
  @RateLimit(WRITE_LIMIT)
  async createCategory(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(CreateCategorySchema)) input: CreateCategory,
  ) {
    return AdminCategorySchema.parse(
      await this.taxonomy.createCategory(adminCommand(request), input),
    );
  }

  @Patch('categories/:categoryId')
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiParam({ name: 'categoryId', schema: UUID })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiOperation({
    operationId: 'superAdminCatalogCategoryUpdate',
    summary: 'Update a category',
    description: `Allow-listed {nameEn?,nameHi?,icon?,imageAssetId?,active?,sortOrder?,expectedVersion}; kind and slug are immutable. Deactivation hides the category from public reads and Home without deleting listings. Emits catalog.taxonomy.changed. ${IMAGE} ${AUDITED}`,
  })
  @ApiOkResponse({ type: AdminCategoryDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for no changes, invalid fields or unexpected keys.',
    404: 'CATEGORY_NOT_FOUND.',
    409: 'CATALOG_VERSION_CONFLICT for a stale expectedVersion; idempotency conflicts.',
    422: 'CATALOG_IMAGE_INVALID.',
    503: MAINTENANCE_NOTE,
  })
  @RateLimit(WRITE_LIMIT)
  async updateCategory(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(CategoryParamsSchema)) params: CategoryParams,
    @Body(new InputPipe(UpdateCategorySchema)) input: UpdateCategory,
  ) {
    return AdminCategorySchema.parse(
      await this.taxonomy.updateCategory(
        adminCommand(request),
        params.categoryId,
        input,
      ),
    );
  }

  @Post('categories/:categoryId/subcategories')
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiParam({ name: 'categoryId', schema: UUID })
  @ApiBody({ type: CreateSubcategoryDto })
  @ApiOperation({
    operationId: 'superAdminCatalogSubcategoryCreate',
    summary: 'Create a subcategory directly',
    description: `{nameEn,nameHi,serviceTypes?,imageAssetId?,expectedVersion?}; the slug is derived from nameEn and immutable; expectedVersion optionally pins the parent category version. Emits catalog.taxonomy.changed. ${NAMES} ${IMAGE} ${AUDITED}`,
  })
  @ApiCreatedResponse({ type: AdminSubcategoryDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for invalid names/serviceTypes, a name that yields an empty slug or unexpected keys.',
    404: 'CATEGORY_NOT_FOUND.',
    409: 'SUBCATEGORY_DUPLICATE for a normalized EN/HI name or slug clash in the category; CATALOG_VERSION_CONFLICT for a stale parent version; idempotency conflicts.',
    422: 'CATALOG_IMAGE_INVALID.',
    503: MAINTENANCE_NOTE,
  })
  @RateLimit(WRITE_LIMIT)
  async createSubcategory(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(CategoryParamsSchema)) params: CategoryParams,
    @Body(new InputPipe(CreateSubcategorySchema)) input: CreateSubcategory,
  ) {
    return AdminSubcategorySchema.parse(
      await this.taxonomy.createSubcategory(
        adminCommand(request),
        params.categoryId,
        input,
      ),
    );
  }

  @Patch('subcategories/:subcategoryId')
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiParam({ name: 'subcategoryId', schema: UUID })
  @ApiBody({ type: UpdateSubcategoryDto })
  @ApiOperation({
    operationId: 'superAdminCatalogSubcategoryUpdate',
    summary: 'Update a subcategory',
    description: `Allow-listed {nameEn?,nameHi?,serviceTypes?,imageAssetId?,active?,sortOrder?,expectedVersion}; slug and parent are immutable. Deactivation hides it from public reads, Home and new selections. Emits catalog.taxonomy.changed. ${NAMES} ${IMAGE} ${AUDITED}`,
  })
  @ApiOkResponse({ type: AdminSubcategoryDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for no changes, invalid fields or unexpected keys.',
    404: 'SUBCATEGORY_NOT_FOUND.',
    409: 'SUBCATEGORY_DUPLICATE for a renamed clash; CATALOG_VERSION_CONFLICT for a stale expectedVersion; idempotency conflicts.',
    422: 'CATALOG_IMAGE_INVALID.',
    503: MAINTENANCE_NOTE,
  })
  @RateLimit(WRITE_LIMIT)
  async updateSubcategory(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(SubcategoryParamsSchema)) params: SubcategoryParams,
    @Body(new InputPipe(UpdateSubcategorySchema)) input: UpdateSubcategory,
  ) {
    return AdminSubcategorySchema.parse(
      await this.taxonomy.updateSubcategory(
        adminCommand(request),
        params.subcategoryId,
        input,
      ),
    );
  }

  // ----- Home sections -------------------------------------------------------

  @Get('home-sections')
  @ApiOperation({
    operationId: 'superAdminCatalogHomeSections',
    summary: 'List Home sections',
    description: `Live (not removed) sections, active and inactive, ordered by position then id, with localized content, pills and versions. ${SECTION} Platform-wide. private, no-store.`,
  })
  @ApiOkResponse({ type: AdminHomeSectionListDto })
  @AdminErrors({ 503: MAINTENANCE_NOTE })
  @RateLimit(READ_LIMIT)
  async listHomeSections(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
  ) {
    return AdminHomeSectionListSchema.parse(
      await this.homeSections.adminList(adminContext(request)),
    );
  }

  @Post('home-sections')
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiBody({ type: CreateHomeSectionDto })
  @ApiOperation({
    operationId: 'superAdminCatalogHomeSectionCreate',
    summary: 'Create a Home section (inactive draft)',
    description: `${SECTION} Created inactive; activation is a separate status command. Emits catalog.home_sections.changed. ${AUDITED}`,
  })
  @ApiCreatedResponse({ type: AdminHomeSectionDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an unknown kind, invalid fields or unexpected keys.',
    409: 'CATALOG_HOME_SECTION_CONFLICT when a live dedicated section already exists for the category; idempotency conflicts.',
    422: 'CATALOG_HOME_SECTION_INVALID for a missing/other-kind category, an initial category outside the pills, duplicate pills or the section limit.',
    503: MAINTENANCE_NOTE,
  })
  @RateLimit(WRITE_LIMIT)
  async createHomeSection(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(CreateHomeSectionSchema)) input: CreateHomeSection,
  ) {
    return AdminHomeSectionSchema.parse(
      await this.homeSections.create(adminCommand(request), input),
    );
  }

  @Patch('home-sections/:sectionId')
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiParam({ name: 'sectionId', schema: UUID })
  @ApiBody({ type: UpdateHomeSectionDto })
  @ApiOperation({
    operationId: 'superAdminCatalogHomeSectionUpdate',
    summary: 'Update Home section content',
    description: `Versioned localized content, category, position and pill ordering update; kind and active state are not editable here (use the status command). An active section must remain publishable. Emits catalog.home_sections.changed. ${AUDITED}`,
  })
  @ApiOkResponse({ type: AdminHomeSectionDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for no changes, invalid fields or unexpected keys.',
    404: 'CATALOG_HOME_SECTION_NOT_FOUND (also for a removed section).',
    409: 'CATALOG_VERSION_CONFLICT for a stale expectedVersion; CATALOG_HOME_SECTION_CONFLICT for a duplicate dedicated category; idempotency conflicts.',
    422: 'CATALOG_HOME_SECTION_INVALID.',
    503: MAINTENANCE_NOTE,
  })
  @RateLimit(WRITE_LIMIT)
  async updateHomeSection(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(HomeSectionParamsSchema)) params: HomeSectionParams,
    @Body(new InputPipe(UpdateHomeSectionSchema)) input: UpdateHomeSection,
  ) {
    return AdminHomeSectionSchema.parse(
      await this.homeSections.update(
        adminCommand(request),
        params.sectionId,
        input,
      ),
    );
  }

  @Post('home-sections/:sectionId/status')
  @HttpCode(200)
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiParam({ name: 'sectionId', schema: UUID })
  @ApiBody({ type: HomeSectionStatusDto })
  @ApiOperation({
    operationId: 'superAdminCatalogHomeSectionStatus',
    summary: 'Activate or deactivate a Home section',
    description: `{event:'activate'|'deactivate',expectedVersion}. Activation rechecks EN/HI content and that the category/subcategory set is active and non-empty. Emits catalog.home_sections.changed. ${AUDITED}`,
  })
  @ApiOkResponse({ type: AdminHomeSectionDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an unknown event or unexpected keys.',
    404: 'CATALOG_HOME_SECTION_NOT_FOUND.',
    409: 'CATALOG_HOME_SECTION_STATE_INVALID when already in the target state or not publishable; CATALOG_VERSION_CONFLICT for a stale expectedVersion; idempotency conflicts.',
    422: 'CATALOG_HOME_SECTION_INVALID when stored content no longer validates.',
    503: MAINTENANCE_NOTE,
  })
  @RateLimit(WRITE_LIMIT)
  async homeSectionStatus(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(HomeSectionParamsSchema)) params: HomeSectionParams,
    @Body(new InputPipe(HomeSectionStatusSchema)) input: HomeSectionStatus,
  ) {
    return AdminHomeSectionSchema.parse(
      await this.homeSections.setStatus(
        adminCommand(request),
        params.sectionId,
        input,
      ),
    );
  }

  @Delete('home-sections/:sectionId')
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiParam({ name: 'sectionId', schema: UUID })
  @ApiBody({ type: ExpectedVersionBodyDto })
  @ApiOperation({
    operationId: 'superAdminCatalogHomeSectionRemove',
    summary: 'Remove a Home section',
    description: `Soft removal guarded by expectedVersion: the section leaves Home and the admin list while its row and audit history are preserved. Emits catalog.home_sections.changed. ${AUDITED}`,
  })
  @ApiOkResponse({ type: HomeSectionRemovedDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for a missing expectedVersion or unexpected keys.',
    404: 'CATALOG_HOME_SECTION_NOT_FOUND.',
    409: 'CATALOG_VERSION_CONFLICT for a stale expectedVersion; idempotency conflicts.',
    503: MAINTENANCE_NOTE,
  })
  @RateLimit(WRITE_LIMIT)
  async removeHomeSection(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(HomeSectionParamsSchema)) params: HomeSectionParams,
    @Body(new InputPipe(ExpectedVersionBodySchema)) input: ExpectedVersionBody,
  ) {
    return HomeSectionRemovedSchema.parse(
      await this.homeSections.remove(
        adminCommand(request),
        params.sectionId,
        input,
      ),
    );
  }

  // ----- Keyword mappings (super_admin until Q-39) ---------------------------

  @Post('keyword-mappings')
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiBody({ type: CreateKeywordMappingDto })
  @ApiOperation({
    operationId: 'superAdminCatalogKeywordMappingCreate',
    summary: 'Create a search keyword mapping',
    description: `{canonicalTerm,synonyms,targets}: one primary term plus EN/HI/Hinglish/typo variants, each stored with its normalized form (NFKC, lowercase, whitespace collapse, unaccent); normalized terms must be unique within and across mappings. Targets are typed active category/subcategory ids or normalized product tags. Admin catalog:edit write access is pending Q-39. Emits catalog.keyword_mapping.changed. ${AUDITED}`,
  })
  @ApiCreatedResponse({ type: KeywordMappingDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for empty/duplicate normalized terms or targets, oversized lists or unexpected keys.',
    409: 'KEYWORD_MAPPING_CONFLICT when a normalized term already belongs to another mapping; idempotency conflicts.',
    422: 'KEYWORD_TARGET_INVALID for a missing or inactive category/subcategory target.',
    503: MAINTENANCE_NOTE,
  })
  @RateLimit(WRITE_LIMIT)
  async createKeywordMapping(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(CreateKeywordMappingSchema))
    input: CreateKeywordMapping,
  ) {
    return KeywordMappingSchema.parse(
      await this.keywords.create(adminCommand(request), input),
    );
  }

  @Patch('keyword-mappings/:mappingId')
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiParam({ name: 'mappingId', schema: UUID })
  @ApiBody({ type: UpdateKeywordMappingDto })
  @ApiOperation({
    operationId: 'superAdminCatalogKeywordMappingUpdate',
    summary: 'Update a search keyword mapping',
    description: `Allow-listed {canonicalTerm?,synonyms?,targets?,expectedVersion}; supplied lists replace the stored ones. Same normalization and target rules as create. Emits catalog.keyword_mapping.changed. ${AUDITED}`,
  })
  @ApiOkResponse({ type: KeywordMappingDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for no changes, empty/duplicate normalized terms or targets, or unexpected keys.',
    404: 'KEYWORD_MAPPING_NOT_FOUND.',
    409: 'KEYWORD_MAPPING_CONFLICT; CATALOG_VERSION_CONFLICT for a stale expectedVersion; idempotency conflicts.',
    422: 'KEYWORD_TARGET_INVALID.',
    503: MAINTENANCE_NOTE,
  })
  @RateLimit(WRITE_LIMIT)
  async updateKeywordMapping(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(KeywordMappingParamsSchema))
    params: KeywordMappingParams,
    @Body(new InputPipe(UpdateKeywordMappingSchema))
    input: UpdateKeywordMapping,
  ) {
    return KeywordMappingSchema.parse(
      await this.keywords.update(
        adminCommand(request),
        params.mappingId,
        input,
      ),
    );
  }

  @Delete('keyword-mappings/:mappingId')
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiParam({ name: 'mappingId', schema: UUID })
  @ApiBody({ type: ExpectedVersionBodyDto })
  @ApiOperation({
    operationId: 'superAdminCatalogKeywordMappingDelete',
    summary: 'Delete a search keyword mapping',
    description: `{expectedVersion}. Deletes the mapping with its terms and targets; the audit entry keeps the before snapshot. Emits catalog.keyword_mapping.changed. ${AUDITED}`,
  })
  @ApiOkResponse({ type: KeywordMappingDeletedDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for a missing expectedVersion or unexpected keys.',
    404: 'KEYWORD_MAPPING_NOT_FOUND.',
    409: 'CATALOG_VERSION_CONFLICT for a stale expectedVersion; idempotency conflicts.',
    503: MAINTENANCE_NOTE,
  })
  @RateLimit(WRITE_LIMIT)
  async deleteKeywordMapping(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(KeywordMappingParamsSchema))
    params: KeywordMappingParams,
    @Body(new InputPipe(ExpectedVersionBodySchema)) input: ExpectedVersionBody,
  ) {
    return KeywordMappingDeletedSchema.parse(
      await this.keywords.remove(
        adminCommand(request),
        params.mappingId,
        input,
      ),
    );
  }
}
