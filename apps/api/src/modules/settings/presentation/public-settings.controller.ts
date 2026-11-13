import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  LEGAL_SLUGS,
  LegalPageSchema,
  LegalQuerySchema,
  LegalSlugParamsSchema,
  PlatformHealthSchema,
  PublicSettingsSchema,
  type LegalQuery,
  type LegalSlugParams,
} from '@apnatown/shared/settings';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { PublicRoute } from '../../../shared/auth';
import { InputPipe } from '../../../shared/auth/validation';
import { ErrorDto } from '../../../shared/health/health.controller';
import { MaintenanceAdmission } from '../../../shared/maintenance/admission';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { PublicSettingsService } from '../application/public-settings.service';
import {
  LegalPageDto,
  LegalQueryDto,
  PlatformHealthDto,
  PublicSettingsDto,
} from './settings.dto';

const readLimit = {
  key: 'settings.public-read',
  subject: 'ip',
  maximumHits: 120,
  windowSeconds: 60,
} as const;

/** Safe public reads; admitted during maintenance (admission matrix). */
@ApiTags('settings')
@PublicRoute()
@MaintenanceAdmission('always')
@ApiResponse({ status: 400, type: ErrorDto, description: 'VALIDATION_ERROR' })
@ApiResponse({ status: 403, type: ErrorDto, description: 'Untrusted Origin' })
@ApiResponse({
  status: 429,
  type: ErrorDto,
  description: 'COMMON_RATE_LIMITED: read limit exceeded',
})
@ApiResponse({ status: 500, type: ErrorDto, description: 'Unexpected failure' })
@ApiResponse({
  status: 503,
  type: ErrorDto,
  description: 'COMMON_UNAVAILABLE: settings store unavailable',
})
@Controller()
export class PublicSettingsController {
  constructor(private readonly settings: PublicSettingsService) {}

  @Get('settings/public')
  @RateLimit(readLimit)
  @ApiOperation({
    operationId: 'settingsPublic',
    summary: 'Read the safe public settings projection',
    description:
      'Branding, current feature flags, checkout payment-method availability (flag on and prerequisites configured), approved refund policy, safe upload constraints, SEO defaults, enabled public plan/promotion prices, configured support Call/WhatsApp E.164 contacts (null when not configured) and version metadata. Unconfigured keys are null. Never returns credentials, sender secrets, supplier evidence or internal tax configuration. Not cached (current flags); admitted during maintenance.',
  })
  @ApiResponse({ status: 200, type: PublicSettingsDto })
  async publicSettings(
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
  ) {
    return PublicSettingsSchema.parse(await this.settings.publicSettings());
  }

  @Get('legal/:slug')
  @RateLimit(readLimit)
  @ApiOperation({
    operationId: 'legalPage',
    summary: 'Read a published legal page',
    description:
      'Localized title and sanitised Markdown-subset body (headings, paragraphs, lists, https links); render without raw HTML. Web caches under the ISR tag legal:{slug}, revalidated by legal.updated. Admitted during maintenance.',
  })
  @ApiParam({ name: 'slug', enum: [...LEGAL_SLUGS] })
  @ApiQuery({ type: LegalQueryDto })
  @ApiResponse({ status: 200, type: LegalPageDto })
  @ApiResponse({
    status: 404,
    type: ErrorDto,
    description:
      'LEGAL_PAGE_NOT_FOUND until the page is published (approved copy pending).',
  })
  async legal(
    @Param(new InputPipe(LegalSlugParamsSchema)) params: LegalSlugParams,
    @Query(new InputPipe(LegalQuerySchema)) query: LegalQuery,
  ) {
    return LegalPageSchema.parse(
      await this.settings.legal(params.slug, query.locale),
    );
  }

  @Get('health')
  @RateLimit({ ...readLimit, key: 'settings.health' })
  @ApiOperation({
    operationId: 'healthStatus',
    summary: 'Platform status',
    description:
      'HTTP 200 with status ok or maintenance and checkedAt; always admitted, no-store, no dependency or secret details. Infrastructure probes use /health/live and /health/ready.',
  })
  @ApiResponse({ status: 200, type: PlatformHealthDto })
  async health(
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
  ) {
    return PlatformHealthSchema.parse(await this.settings.health());
  }
}
