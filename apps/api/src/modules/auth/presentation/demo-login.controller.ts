import {
  Body,
  Controller,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import {
  DemoSessionInputSchema,
  SessionSchema,
  type DemoSessionInput,
} from '@apnatown/shared/auth';
import { sessionBinding, type AuthRequest } from '../../../shared/auth';
import { SessionCookie } from '../../../shared/auth/cookie';
import { SessionRoute } from '../../../shared/auth/metadata';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { DemoLoginService } from '../application/demo-login.service';
import { DemoSessionInputDto, SessionDto } from './dto';

/** Mounted only by AuthModule when DEMO_LOGIN_ENABLED outside production. */
@ApiTags('auth')
@PrivateApi()
@Controller('auth/demo')
export class DemoLoginController {
  constructor(
    private readonly demo: DemoLoginService,
    private readonly cookie: SessionCookie,
  ) {}

  @Post('sessions')
  @HttpCode(200)
  @SessionRoute()
  @BrowserMutation()
  @RateLimit({
    key: 'auth.demo.session',
    maximumHits: 30,
    windowSeconds: 60,
    subject: 'ip',
  })
  @ApiBody({ type: DemoSessionInputDto })
  @ApiOkResponse({ type: SessionDto })
  @ApiOperation({
    description:
      'Local/test only (DEMO_LOGIN_ENABLED; refused in production, docs/adr/0002). Replaces the current session with a seeded demo persona that already holds the role; never creates users or grants roles. Absent from deployed APIs (404).',
  })
  async create(
    @Req() request: AuthRequest,
    @Body(new InputPipe(DemoSessionInputSchema)) input: DemoSessionInput,
    @Res({ passthrough: true }) response: Response,
    @Query(new InputPipe(EmptyRequestSchema))
    _query: Record<string, never> = {},
  ) {
    const { issued, principal } = await this.demo.signIn(
      sessionBinding(request),
      input.persona,
    );
    const session = SessionSchema.parse({
      ...principal,
      expiresAt: issued.session.expiresAt.toISOString(),
    });
    this.cookie.set(response, issued.token, issued.session.expiresAt);
    return session;
  }
}
