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
  ApiAcceptedResponse,
  ApiBody,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateSupportMessageSchema,
  SupportMessageAcceptedSchema,
  SupportMessageDetailSchema,
  SupportMessageParamsSchema,
  type CreateSupportMessage,
  type SupportMessageParams,
} from '@apnatown/shared/settings';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import {
  adminContext,
  Permission,
  Roles,
  Scoped,
  SessionRoute,
  sessionBinding,
  type AuthRequest,
} from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { currentCorrelationId } from '../../../shared/logger/context';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { AdminErrors } from '../../admin/presentation/admin.dto';
import {
  SUPPORT_INTAKE_LIMIT,
  SupportService,
} from '../application/support.service';
import {
  CreateSupportMessageDto,
  SupportMessageAcceptedDto,
  SupportMessageDetailDto,
} from './settings.dto';

@ApiTags('support')
@Controller('support/messages')
export class SupportMessagesController {
  constructor(private readonly support: SupportService) {}

  @Post()
  @HttpCode(202)
  @SessionRoute()
  @BrowserMutation()
  @ApiSecurity('sessionCookie')
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description:
      'Case-sensitive key; retry the identical message within 24 hours to replay the accepted result.',
    schema: {
      type: 'string',
      minLength: 1,
      maxLength: 128,
      pattern: '^[A-Za-z0-9._:-]+$',
    },
  })
  @ApiBody({ type: CreateSupportMessageDto })
  @ApiOperation({
    operationId: 'supportMessageCreate',
    summary: 'Send a message to support',
    description:
      'Guest (anonymous browser session) or signed-in user; no phone or login required. Message-only plain text, trimmed 1..1000 characters; author and scope are derived server-side, never from the body. The message and the admin-notification outbox event commit together before 202; no ticket, reply channel or response time is promised. Limited to 5 per hour per user/anonymous session and per network address. Blocked with MAINTENANCE while maintenance mode is on.',
  })
  @ApiAcceptedResponse({ type: SupportMessageAcceptedDto })
  @ApiResponseErrors()
  @RateLimit(
    { ...SUPPORT_INTAKE_LIMIT, subject: 'session' },
    { ...SUPPORT_INTAKE_LIMIT, key: 'support.intake.ip', subject: 'ip' },
  )
  async create(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Body(new InputPipe(CreateSupportMessageSchema))
    input: CreateSupportMessage,
  ) {
    const correlationId = currentCorrelationId();
    if (!correlationId) throw new Error('MISSING_CORRELATION_CONTEXT');
    return SupportMessageAcceptedSchema.parse(
      await this.support.submit(
        {
          session: sessionBinding(request),
          principalId: request.principal?.userId ?? null,
          correlationId,
          key: request.headers['idempotency-key'],
        },
        input.message,
      ),
    );
  }
}

function ApiResponseErrors() {
  return AdminErrors({
    400: 'VALIDATION_ERROR for an empty, oversized or control-character message or unexpected fields; COMMON_VALIDATION_FAILED for a missing/invalid Idempotency-Key.',
    403: 'CSRF_INVALID for a missing session, Origin or CSRF token.',
    409: 'Idempotency-Key reused with a different message, or the original request is still in progress.',
    429: 'COMMON_RATE_LIMITED with Retry-After.',
    500: 'Unexpected failure.',
    503: 'MAINTENANCE (errors.system.maintenance) with Retry-After while maintenance mode is on; COMMON_UNAVAILABLE when the store is unavailable.',
  });
}

@ApiTags('admin')
@PrivateApi()
@Roles('admin', 'super_admin')
@Permission('users', 'view')
@Controller('admin/support/messages')
export class AdminSupportMessagesController {
  constructor(private readonly support: SupportService) {}

  @Get(':id')
  @Scoped('support_message')
  @ApiParam({ name: 'id', schema: { type: 'string', format: 'uuid' } })
  @ApiOperation({
    operationId: 'adminSupportMessage',
    summary: 'Read one support message for the overview alert',
    description:
      'Requires an active admin with users:view and the exact resolved scope of the message (area grant or whole-city grant); unscoped/global guest messages are super_admin only. Returns plain text to render inert, with an optional author display label; no reporter contact or export. Linked from /admin/overview?supportMessageId={id}. private, no-store.',
  })
  @ApiOkResponse({ type: SupportMessageDetailDto })
  @AdminErrors({
    403: 'COMMON_FORBIDDEN without users:view; ADMIN_SCOPE_FORBIDDEN outside the message scope; ADMIN_INACTIVE for a deactivated admin.',
    404: 'SUPPORT_MESSAGE_NOT_FOUND.',
    503: 'MAINTENANCE while maintenance mode is on (admins are not admitted).',
  })
  @RateLimit({
    key: 'admin.support.read',
    maximumHits: 120,
    windowSeconds: 60,
    subject: 'principal',
  })
  async detail(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema)) _query: Record<string, never>,
    @Param(new InputPipe(SupportMessageParamsSchema))
    params: SupportMessageParams,
  ) {
    return SupportMessageDetailSchema.parse(
      await this.support.detail(adminContext(request), {
        messageId: params.id,
      }),
    );
  }
}
