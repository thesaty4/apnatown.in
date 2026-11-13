import { Body, Controller, Get, Param, Put, Query, Req } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  FEATURE_FLAG_KEYS,
  FUTURE_FEATURE_FLAGS,
  FeatureFlagParamsSchema,
  FeatureFlagSchema,
  LEGAL_SLUGS,
  LegalPageAdminSchema,
  LegalSlugParamsSchema,
  SETTING_KEYS,
  SavedSettingSchema,
  SavedSettingsGroupSchema,
  SettingKeyParamsSchema,
  SettingsGroupParamsSchema,
  SuperAdminSettingsSchema,
  UpdateFeatureFlagSchema,
  UpdateLegalPageSchema,
  UpdateSettingSchema,
  UpdateSettingsGroupSchema,
  SettingsGroupSchema,
  type FeatureFlagParams,
  type LegalSlugParams,
  type SettingKeyParams,
  type SettingsGroupParams,
  type UpdateFeatureFlag,
  type UpdateLegalPage,
  type UpdateSetting,
  type UpdateSettingsGroup,
} from '@apnatown/shared/settings';
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
import { SettingsService } from '../application/settings.service';
import {
  FeatureFlagDto,
  LegalPageAdminDto,
  SavedSettingDto,
  SavedSettingsGroupDto,
  SuperAdminSettingsDto,
  UpdateFeatureFlagDto,
  UpdateLegalPageDto,
  UpdateSettingDto,
  UpdateSettingsGroupDto,
} from './settings.dto';

const WRITE_LIMIT = {
  key: 'super-admin.settings.write',
  maximumHits: 30,
  windowSeconds: 60,
  subject: 'principal',
} as const;
const AUDITED =
  'super_admin only; admitted during maintenance for recovery. Rechecks super_admin in the transaction, writes one audit entry and its outbox events atomically.';
const MAINTENANCE_NOTE =
  'MAINTENANCE (errors.system.maintenance) with Retry-After for an authenticated non-super session while maintenance is on; COMMON_UNAVAILABLE when the store is unavailable.';

@ApiTags('super-admin')
@PrivateApi()
@Roles('super_admin')
@MaintenanceAdmission('super')
@Controller('super-admin')
export class SuperAdminSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('settings')
  @ApiOperation({
    operationId: 'superAdminSettings',
    summary: 'Read all settings, flags, legal pages and readiness',
    description:
      'Every setting key with value (null when never configured or invalid), version (0 when absent), group membership and updatedAt; feature flags with enablable; legal page status (version 0 = unpublished); integrationStatus {configured} from deployment configuration only (never secrets); readiness for plans, promotions, tax and images. private, no-store.',
  })
  @ApiOkResponse({ type: SuperAdminSettingsDto })
  @AdminErrors({ 503: MAINTENANCE_NOTE })
  @RateLimit({
    key: 'super-admin.settings.read',
    maximumHits: 120,
    windowSeconds: 60,
    subject: 'principal',
  })
  async read(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
  ) {
    return SuperAdminSettingsSchema.parse(
      await this.settings.read(adminContext(request)),
    );
  }

  @Put('settings/groups/:group')
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiParam({ name: 'group', enum: [...SettingsGroupSchema.options] })
  @ApiBody({ type: UpdateSettingsGroupDto })
  @ApiOperation({
    operationId: 'superAdminUpdateSettingsGroup',
    summary: 'Atomically save a settings group',
    description: `Groups: delivery_rider_pay = delivery + rider_earning; commission_plans = commission + plans + promotion_fees; policies_reviews = policies + reviews. Supply every member key exactly once with its expectedVersion (0 = never configured). All keys are validated, locked in stable order and committed together with one audit entry, settings.updated per key and settings.group_updated; any invalid or stale key rolls all back. Same key and payload replays the saved group. ${AUDITED}`,
  })
  @ApiOkResponse({ type: SavedSettingsGroupDto })
  @AdminErrors({
    409: 'SETTINGS_VERSION_CONFLICT when any expectedVersion is stale (nothing saved).',
    422: 'SETTINGS_INVALID for missing, duplicate or extra keys or any invalid value (details.fields lists offending paths).',
    503: MAINTENANCE_NOTE,
  })
  @RateLimit(WRITE_LIMIT)
  async updateGroup(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(SettingsGroupParamsSchema))
    params: SettingsGroupParams,
    @Body(new InputPipe(UpdateSettingsGroupSchema)) input: UpdateSettingsGroup,
  ) {
    return SavedSettingsGroupSchema.parse(
      await this.settings.updateGroup(
        adminCommand(request),
        params.group,
        input,
      ),
    );
  }

  @Put('settings/:key')
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiParam({ name: 'key', enum: [...SETTING_KEYS] })
  @ApiBody({ type: UpdateSettingDto })
  @ApiOperation({
    operationId: 'superAdminUpdateSetting',
    summary: 'Save one ungrouped setting key',
    description: `Ungrouped keys only (branding, payments, uploads, integrations, seo, tax); group members must use PUT /super-admin/settings/groups/{group}. value is validated against the key's schema (money integer paise, bps 0..10000, E.164 contacts, upload limits within hard ceilings, provider IDs only for configured adapters, complete tax references). expectedVersion 0 creates a never-configured key. Emits settings.updated. ${AUDITED}`,
  })
  @ApiOkResponse({ type: SavedSettingDto })
  @AdminErrors({
    409: 'SETTINGS_VERSION_CONFLICT when expectedVersion is stale.',
    422: 'SETTINGS_INVALID for an invalid value (details.fields); SETTINGS_GROUP_REQUIRED for a grouped member key.',
    503: MAINTENANCE_NOTE,
  })
  @RateLimit(WRITE_LIMIT)
  async updateSetting(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(SettingKeyParamsSchema)) params: SettingKeyParams,
    @Body(new InputPipe(UpdateSettingSchema)) input: UpdateSetting,
  ) {
    return SavedSettingSchema.parse(
      await this.settings.updateSetting(
        adminCommand(request),
        params.key,
        input,
      ),
    );
  }

  @Put('feature-flags/:key')
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiParam({ name: 'key', enum: [...FEATURE_FLAG_KEYS] })
  @ApiBody({ type: UpdateFeatureFlagDto })
  @ApiOperation({
    operationId: 'superAdminUpdateFeatureFlag',
    summary: 'Toggle a feature flag',
    description: `Versioned toggle. ${FUTURE_FEATURE_FLAGS.join(' and ')} can never be enabled; payments_online and whatsapp cannot be enabled until their adapter is configured. Disabling is always allowed. Emits feature_flag.updated; consumers recheck the authoritative flag. ${AUDITED}`,
  })
  @ApiOkResponse({ type: FeatureFlagDto })
  @AdminErrors({
    409: 'SETTINGS_VERSION_CONFLICT when expectedVersion is stale; FEATURE_NOT_AVAILABLE when enabling a future or unconfigured feature.',
    422: 'SETTINGS_INVALID for an unknown flag row.',
    503: MAINTENANCE_NOTE,
  })
  @RateLimit(WRITE_LIMIT)
  async updateFlag(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(FeatureFlagParamsSchema)) params: FeatureFlagParams,
    @Body(new InputPipe(UpdateFeatureFlagSchema)) input: UpdateFeatureFlag,
  ) {
    return FeatureFlagSchema.parse(
      await this.settings.updateFlag(adminCommand(request), params.key, input),
    );
  }

  @Put('legal/:slug')
  @BrowserMutation()
  @IdempotentAdmin()
  @ApiParam({ name: 'slug', enum: [...LEGAL_SLUGS] })
  @ApiBody({ type: UpdateLegalPageDto })
  @ApiOperation({
    operationId: 'superAdminUpdateLegalPage',
    summary: 'Publish a legal page',
    description: `EN and HI title/body are sanitised to the allow-listed Markdown subset (headings, paragraphs, lists, https links); HTML, scripts, images and non-https links are removed before storage. expectedVersion 0 publishes the first version. Emits legal.updated (web revalidates legal:{slug}). ${AUDITED}`,
  })
  @ApiOkResponse({ type: LegalPageAdminDto })
  @AdminErrors({
    409: 'SETTINGS_VERSION_CONFLICT when expectedVersion is stale.',
    422: 'SETTINGS_INVALID when a field is empty after sanitising.',
    503: MAINTENANCE_NOTE,
  })
  @RateLimit(WRITE_LIMIT)
  async updateLegal(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(LegalSlugParamsSchema)) params: LegalSlugParams,
    @Body(new InputPipe(UpdateLegalPageSchema)) input: UpdateLegalPage,
  ) {
    return LegalPageAdminSchema.parse(
      await this.settings.updateLegal(
        adminCommand(request),
        params.slug,
        input,
      ),
    );
  }
}
