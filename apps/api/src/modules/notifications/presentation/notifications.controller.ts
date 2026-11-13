import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  NotificationFeedQuerySchema,
  NotificationPreferencesUpdateSchema,
  NotificationRoleQuerySchema,
  NotificationRoleSchema,
  NotificationUnsubscribeMarketingSchema,
  type NotificationFeedQuery,
  type NotificationPreferencesUpdate,
  type NotificationRoleQuery,
  type NotificationUnsubscribeMarketing,
} from '@apnatown/shared/notifications';
import { EmptyRequestSchema, IdSchema } from '@apnatown/shared/wire';
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
import { NotificationFeedService } from '../application/notification-feed.service';
import { NotificationPreferencesService } from '../application/notification-preferences.service';
import {
  NotificationPageDto,
  NotificationPreferencesDto,
  NotificationPreferencesUpdateDto,
  NotificationUnreadCountDto,
  NotificationUnsubscribeMarketingDto,
  NotificationUnsubscribeMarketingResultDto,
} from './notifications.dto';

const READ_LIMIT = { key: 'notifications.read', maximumHits: 240, windowSeconds: 60, subject: 'principal' } as const;
const WRITE_LIMIT = { key: 'notifications.write', maximumHits: 60, windowSeconds: 60, subject: 'principal' } as const;
const PREFERENCE_LIMIT = { key: 'notifications.preferences.write', maximumHits: 30, windowSeconds: 60, subject: 'principal' } as const;
const ROLE_QUERY = { name: 'role', enum: NotificationRoleSchema.options, required: true } as const;

function own(request: AuthRequest) {
  if (!request.principal) throw new DomainError('SESSION_EXPIRED');
  return { session: sessionBinding(request), actorId: request.principal.userId };
}

@ApiTags('notifications')
@PrivateApi()
@OwnAccount()
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly feed: NotificationFeedService,
    private readonly preferences: NotificationPreferencesService,
  ) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({
    operationId: 'notificationsList',
    summary: 'List own in-app notifications for one role',
    description:
      'Published in-app items for the caller and a role the caller currently holds (vendor/provider applicants qualify through their own business), newest first, keyset-paginated. Admin alerts are filtered by live module/scope grants on every read. New items are hinted over GET /realtime/stream (`event: notification`); refetch this list/unread-count on receipt.',
  })
  @ApiQuery(ROLE_QUERY)
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', minimum: 1, maximum: 50, default: 20 } })
  @ApiOkResponse({ type: NotificationPageDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR for an unknown role, bad cursor or limit.',
    403: 'COMMON_FORBIDDEN when the caller does not hold the requested role.',
  })
  @RateLimit(READ_LIMIT)
  async list(
    @Req() request: AuthRequest,
    @Query(new InputPipe(NotificationFeedQuerySchema)) query: NotificationFeedQuery,
  ) {
    return this.feed.list(own(request), query);
  }

  @Get('unread-count')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({
    operationId: 'notificationsUnreadCount',
    summary: 'Own unread in-app count for one role (bell badge)',
  })
  @ApiQuery(ROLE_QUERY)
  @ApiOkResponse({ type: NotificationUnreadCountDto })
  @AdminErrors({ 403: 'COMMON_FORBIDDEN when the caller does not hold the requested role.' })
  @RateLimit(READ_LIMIT)
  async unreadCount(
    @Req() request: AuthRequest,
    @Query(new InputPipe(NotificationRoleQuerySchema)) query: NotificationRoleQuery,
  ) {
    return this.feed.unreadCount(own(request), query.role);
  }

  @Post('read-all')
  @HttpCode(204)
  @BrowserMutation()
  @ApiOperation({
    operationId: 'notificationsReadAll',
    summary: 'Mark all own visible notifications for one role read',
  })
  @ApiQuery(ROLE_QUERY)
  @ApiNoContentResponse()
  @AdminErrors({ 403: 'COMMON_FORBIDDEN when the caller does not hold the requested role.' })
  @RateLimit(WRITE_LIMIT)
  async readAll(
    @Req() request: AuthRequest,
    @Query(new InputPipe(NotificationRoleQuerySchema)) query: NotificationRoleQuery,
    @Body(new InputPipe(EmptyRequestSchema)) _body: Record<string, never> = {},
  ): Promise<void> {
    await this.feed.readAll(own(request), query.role);
  }

  @Post(':id/read')
  @HttpCode(204)
  @BrowserMutation()
  @ApiOperation({
    operationId: 'notificationsRead',
    summary: 'Mark one own notification read',
    description: 'Idempotent. Another user’s item, or one for a role/scope the caller no longer holds, is NOTIFICATION_NOT_FOUND.',
  })
  @ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid' } })
  @ApiNoContentResponse()
  @AdminErrors({ 404: 'NOTIFICATION_NOT_FOUND' })
  @RateLimit(WRITE_LIMIT)
  async read(
    @Req() request: AuthRequest,
    @Param('id', new InputPipe(IdSchema)) id: string,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never> = {},
    @Body(new InputPipe(EmptyRequestSchema)) _body: Record<string, never> = {},
  ): Promise<void> {
    await this.feed.read(own(request), id);
  }

  @Get('preferences')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({
    operationId: 'notificationsPreferencesGet',
    summary: 'Own notification preferences with current consent state',
    description: 'WhatsApp keys (default off) report the effective value: preference AND a live Users consent grant. Consent evidence is read live from Users.',
  })
  @ApiOkResponse({ type: NotificationPreferencesDto })
  @RateLimit(READ_LIMIT)
  async getPreferences(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never> = {},
  ) {
    return this.preferences.get(own(request));
  }

  @Put('preferences')
  @BrowserMutation()
  @ApiOperation({
    operationId: 'notificationsPreferencesUpdate',
    summary: 'Update own notification preferences',
    description: 'Optimistic on expectedVersion. Setting wa_orders/wa_offers/wa_enq true needs a current grant or a consentAcknowledgements entry for its purpose/channel with the current noticeVersion; an ungranted stored WhatsApp key is saved off. Turning a WhatsApp key off withdraws its consent pair.',
  })
  @ApiBody({ type: NotificationPreferencesUpdateDto })
  @ApiOkResponse({ type: NotificationPreferencesDto })
  @AdminErrors({
    400: 'VALIDATION_ERROR (no key, unknown field, or an acknowledgement not matching a key set true).',
    409: 'NOTIFICATION_VERSION_CONFLICT when expectedVersion is stale.',
    422: 'CONSENT_REQUIRED when a WhatsApp key is enabled without a current grant or valid notice acknowledgement.',
  })
  @RateLimit(PREFERENCE_LIMIT)
  async updatePreferences(
    @Req() request: AuthRequest,
    @Body(new InputPipe(NotificationPreferencesUpdateSchema)) body: NotificationPreferencesUpdate,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never> = {},
  ) {
    return this.preferences.update(own(request), body);
  }

  @Post('preferences/unsubscribe-marketing')
  @HttpCode(200)
  @BrowserMutation()
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Retry the identical unsubscribe within 24 hours.',
    schema: { type: 'string', minLength: 1, maxLength: 128, pattern: '^[A-Za-z0-9._:-]+$' },
  })
  @ApiOperation({
    operationId: 'notificationsUnsubscribeMarketing',
    summary: 'Signed-in one-click marketing opt-out',
    description: 'Sets wa_offers (marketing WhatsApp) off and withdraws marketing consent on in_app, email and whatsapp. inapp/email gate transactional updates and are unchanged. A replay rechecks the live session.',
  })
  @ApiBody({ type: NotificationUnsubscribeMarketingDto })
  @ApiOkResponse({ type: NotificationUnsubscribeMarketingResultDto })
  @AdminErrors({
    400: 'COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    409: 'NOTIFICATION_VERSION_CONFLICT, or Idempotency-Key reuse with a different body.',
  })
  @RateLimit(PREFERENCE_LIMIT)
  async unsubscribeMarketing(
    @Req() request: AuthRequest,
    @Body(new InputPipe(NotificationUnsubscribeMarketingSchema)) body: NotificationUnsubscribeMarketing,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never> = {},
  ) {
    const correlationId = currentCorrelationId();
    if (!correlationId) throw new Error('MISSING_CORRELATION_CONTEXT');
    return this.preferences.unsubscribeMarketing(
      { ...own(request), correlationId, key: request.headers['idempotency-key'] },
      body.expectedVersion,
    );
  }
}
