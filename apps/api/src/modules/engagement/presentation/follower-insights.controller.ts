import { Body, Controller, Get, Header, HttpCode, Post, Query, Req } from '@nestjs/common';
import { ApiAcceptedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  FollowerAnnouncementCreateSchema,
  FollowerAnnouncementResultSchema,
  FollowerInsightsSchema,
  type FollowerAnnouncementCreate,
} from '@apnatown/shared';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
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
import { FollowerInsightsService } from '../application/follower-insights.service';

class FollowerInsightsDto extends createZodDto(FollowerInsightsSchema) {}
class FollowerAnnouncementCreateDto extends createZodDto(FollowerAnnouncementCreateSchema) {}
class FollowerAnnouncementResultDto extends createZodDto(FollowerAnnouncementResultSchema) {}

const OWNER =
  "Owner of an APPROVED vendor/provider business with its live seller role, resolved server-side (X-Business-Kind selects between the caller's own businesses). private, no-store.";
const ERRORS = {
  401: 'SESSION_EXPIRED without a signed-in session.',
  403: 'COMMON_FORBIDDEN when the caller has no approved selling business.',
  422: 'BUSINESS_CONTEXT_REQUIRED when the caller owns both kinds and sent no X-Business-Kind.',
  429: 'COMMON_RATE_LIMITED with Retry-After.',
} as const;

/** S-VEND-15 / S-PROV-11 followers (F-VD-015) and announcements (F-NT-003). */
@ApiTags('engagement')
@PrivateApi()
@OwnAccount()
@Controller('businesses/me')
export class FollowerInsightsController {
  constructor(private readonly followers: FollowerInsightsService) {}

  @Get('followers')
  @Header('Cache-Control', 'private, no-store')
  @BusinessKindHeader()
  @ApiOperation({
    operationId: 'businessMeFollowers',
    summary: 'Follower KPIs, eight-week growth and latest announcements',
    description: `reporting-v1: followers = active follows; gained = first-ever follows per Monday-based IST week (refollows excluded); weekly closing totals are known only for the current week (weekly_totals_history unavailable, never reconstructed); approvedVideos = approved, not owner-deleted videos; latest three announcements. ${OWNER}`,
  })
  @ApiOkResponse({ type: FollowerInsightsDto })
  @AdminErrors({ 400: 'VALIDATION_ERROR for any query parameter or an invalid X-Business-Kind.', ...ERRORS })
  @RateLimit({ key: 'engagement.followers.read', maximumHits: 60, windowSeconds: 60, subject: 'principal' })
  insights(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
  ) {
    return this.followers.insights(owner(request));
  }

  @Post('announcements')
  @HttpCode(202)
  @BrowserMutation()
  @BusinessKindHeader()
  @IdempotencyKey('Case-sensitive key; retry the identical announcement within 24 hours to replay the stored result.')
  @ApiOperation({
    operationId: 'businessMeAnnouncementCreate',
    summary: 'Announce to followers',
    description: `{kind: product|service|offer|video, messageEn, messageHi?} is queued for current followers with the bell on; delivery still honours preferences, so eligibleRecipients is not a delivery claim. Untargeted notices link to the kind's public listing. ${OWNER}`,
  })
  @ApiAcceptedResponse({ type: FollowerAnnouncementResultDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for a missing/too long message or unknown kind; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    409: 'Idempotency conflicts (same key, different payload).',
    ...ERRORS,
  })
  @RateLimit({ key: 'engagement.announcements.create', maximumHits: 10, windowSeconds: 3600, subject: 'principal' })
  announce(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(FollowerAnnouncementCreateSchema)) input: FollowerAnnouncementCreateDto,
  ) {
    return this.followers.announce(
      { ...adminCommand(request), ...businessKind(request) },
      input as FollowerAnnouncementCreate,
    );
  }
}
