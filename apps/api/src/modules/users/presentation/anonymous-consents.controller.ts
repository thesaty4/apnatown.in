import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import {
  AnonymousConsentParamsSchema,
  UpdateConsentSchema,
} from '@apnatown/shared/users';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import { PublicRoute } from '../../../shared/auth';
import { LoginRoute } from '../../../shared/auth/metadata';
import { BrowserMutation } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { ConsentService } from '../application/consent.service';
import {
  ConsentErrors,
  ConsentInputPipe,
  UpdateConsentDto,
} from './consents.dto';

const pending =
  'COMMON_UNAVAILABLE (errors.common.unavailable): anonymous consent identity and cookie categories are pending policy approval (Q-31). Nothing is read or recorded.';

/**
 * Q-31-gated visitor consent. Routes exist so the contract is explicit, but
 * no anonymous identity is created and no success is reported until approved.
 */
@ApiTags('consents')
@Controller('consents')
export class AnonymousConsentsController {
  constructor(private readonly consents: ConsentService) {}
  @Get()
  @PublicRoute()
  @ApiOperation({
    summary: 'Read anonymous consent choices (policy pending)',
    description: `Always fails with ${pending}`,
  })
  @ConsentErrors({
    400: 'VALIDATION_ERROR for unexpected query parameters.',
    403: 'Untrusted Origin.',
    429: 'Read limit exceeded.',
    500: 'Unexpected failure.',
    503: pending,
  })
  @RateLimit({
    key: 'consents.anonymous.read',
    maximumHits: 60,
    windowSeconds: 60,
    subject: 'ip',
  })
  list(
    @Query(new InputPipe(EmptyRequestSchema))
    _query: Record<string, never> = {},
  ): never {
    return this.consents.anonymousUnavailable();
  }
  @Put(':purpose')
  @LoginRoute()
  @BrowserMutation()
  @ApiSecurity('sessionCookie')
  @ApiOperation({
    summary: 'Record an anonymous consent choice (policy pending)',
    description: `Requires the anonymous browser session, Origin and CSRF token; signed-in users use PUT /users/me/consents/{purpose}. Valid input still fails with ${pending}`,
  })
  @ApiParam({
    name: 'purpose',
    schema: { type: 'string', pattern: '^[a-z][a-z0-9_]{0,63}$' },
  })
  @ApiBody({ type: UpdateConsentDto })
  @ConsentErrors({
    400: 'VALIDATION_ERROR for an invalid body or query.',
    403: 'CSRF_INVALID for a missing anonymous session, Origin or CSRF token; COMMON_FORBIDDEN for signed-in sessions.',
    422: 'CONSENT_PURPOSE_INVALID for a malformed purpose or channel.',
    429: 'Write limit exceeded.',
    500: 'Unexpected failure.',
    503: pending,
  })
  @RateLimit({
    key: 'consents.anonymous.write',
    maximumHits: 30,
    windowSeconds: 60,
    subject: 'ip',
  })
  update(
    @Param(new ConsentInputPipe(AnonymousConsentParamsSchema, 'purpose'))
    _params: { purpose: string },
    @Body(new ConsentInputPipe(UpdateConsentSchema, 'channel'))
    _input: unknown,
    @Query(new InputPipe(EmptyRequestSchema))
    _query: Record<string, never> = {},
  ): never {
    return this.consents.anonymousUnavailable();
  }
}
