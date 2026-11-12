import { Body, Controller, Get, Param, Put, Query, Req } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  ConsentListSchema,
  ConsentParamsSchema,
  ConsentPurposeSchema,
  ConsentRecordSchema,
  UpdateConsentSchema,
  type ConsentParams,
  type UpdateConsent,
} from '@apnatown/shared/users';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import {
  OwnAccount,
  sessionBinding,
  type AuthRequest,
} from '../../../shared/auth';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { ConsentService } from '../application/consent.service';
import {
  ConsentErrors,
  ConsentInputPipe,
  ConsentListDto,
  ConsentRecordDto,
  UpdateConsentDto,
} from './consents.dto';
import { MaintenanceAdmission } from '../../../shared/maintenance/admission';

@ApiTags('users')
@PrivateApi()
@OwnAccount()
@Controller('users/me/consents')
export class ConsentsController {
  constructor(private readonly consents: ConsentService) {}
  @Get()
  @ApiOperation({
    summary: 'List own consent choices',
    description:
      'Latest recorded choice for every registered purpose/channel pair with its evidence (consentId, recordedAt, noticeVersion). A pair without evidence is not granted. currentNoticeVersion is the notice a grant must acknowledge; null means grants are unavailable until an approved notice is configured.',
  })
  @ApiOkResponse({ type: ConsentListDto })
  @RateLimit({
    key: 'users.consents.read',
    maximumHits: 120,
    windowSeconds: 60,
    subject: 'principal',
  })
  async list(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema))
    _query: Record<string, never> = {},
  ) {
    return ConsentListSchema.parse(
      await this.consents.list(sessionBinding(request)),
    );
  }
  @Put(':purpose')
  // Only a withdrawal (granted: false) is admitted during maintenance.
  @MaintenanceAdmission('consent-withdrawal')
  @BrowserMutation()
  @ApiOperation({
    summary: 'Record an own consent choice',
    description:
      'Appends evidence for one registered pair: marketing with in_app|email|whatsapp; order_updates and enquiry_updates with whatsapp. channel is required. A grant must send the current noticeVersion; withdrawals are never blocked by notice copy. Repeating the current effective choice returns the latest record without new evidence or events.',
  })
  @ApiParam({ name: 'purpose', enum: ConsentPurposeSchema.options })
  @ApiBody({ type: UpdateConsentDto })
  @ApiOkResponse({ type: ConsentRecordDto })
  @ConsentErrors({
    422: 'CONSENT_PURPOSE_INVALID for an unregistered purpose/channel pair; CONSENT_NOTICE_INVALID when a grant does not acknowledge the configured current notice.',
  })
  @RateLimit({
    key: 'users.consents.write',
    maximumHits: 30,
    windowSeconds: 60,
    subject: 'principal',
  })
  async update(
    @Req() request: AuthRequest,
    @Param(new ConsentInputPipe(ConsentParamsSchema, 'purpose'))
    params: ConsentParams,
    @Body(new ConsentInputPipe(UpdateConsentSchema, 'channel'))
    input: UpdateConsent,
    @Query(new InputPipe(EmptyRequestSchema))
    _query: Record<string, never> = {},
  ) {
    return ConsentRecordSchema.parse(
      await this.consents.update(
        sessionBinding(request),
        params.purpose,
        input,
      ),
    );
  }
}
