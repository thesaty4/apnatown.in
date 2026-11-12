import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { EmptyRequestSchema } from '@apnatown/shared/wire';
import {
  ChallengeInputSchema,
  ChallengeParamsSchema,
  ChallengeSchema,
  CsrfSchema,
  VerifyInputSchema,
  SessionSchema,
  type ChallengeInput,
  type VerifyInput,
} from '@apnatown/shared/auth';
import {
  OwnAccount,
  sessionBinding,
  type AuthRequest,
} from '../../../shared/auth';
import { SessionCookie } from '../../../shared/auth/cookie';
import { CsrfBootstrap, LoginRoute } from '../../../shared/auth/metadata';
import { BrowserMutation, PrivateApi } from '../../../shared/auth/openapi';
import { InputPipe } from '../../../shared/auth/validation';
import { DomainError } from '../../../shared/errors/errors';
import { RateLimit } from '../../../shared/rate-limit/rate-limit';
import { OtpService } from '../application/otp.service';
import { SessionService } from '../application/session.service';
import {
  ChallengeDto,
  ChallengeInputDto,
  CsrfDto,
  EmptyDto,
  LogoutDto,
  SessionDto,
  VerifyInputDto,
} from './dto';

@ApiTags('auth')
@PrivateApi()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly sessions: SessionService,
    private readonly otp: OtpService,
    private readonly cookie: SessionCookie,
  ) {}

  @Get('csrf')
  @CsrfBootstrap()
  @RateLimit({
    key: 'auth.csrf',
    maximumHits: 30,
    windowSeconds: 60,
    subject: 'ip',
  })
  @ApiOkResponse({ type: CsrfDto })
  @ApiOperation({
    security: [],
    description:
      'Same-origin bootstrap (Origin or Sec-Fetch-Site: same-origin). Persists anonymous state before returning its cookie/token. Never renews expired authenticated access.',
  })
  async csrf(
    @Req() request: AuthRequest,
    @Res({ passthrough: true }) response: Response,
    @Query(new InputPipe(EmptyRequestSchema))
    _query: Record<string, never> = {},
  ) {
    try {
      const state = await this.sessions.bootstrap(this.cookie.read(request));
      if (state.token)
        this.cookie.set(response, state.token, state.session.expiresAt);
      return CsrfSchema.parse({ csrfToken: state.session.csrfToken });
    } catch (error) {
      if (
        error instanceof DomainError &&
        ['SESSION_EXPIRED', 'ACCOUNT_UNAVAILABLE'].includes(error.code)
      )
        this.cookie.clear(response);
      throw error;
    }
  }
  @Post('otp/challenges')
  @LoginRoute()
  @BrowserMutation()
  @RateLimit({
    key: 'auth.otp.challenge',
    maximumHits: 10,
    windowSeconds: 60,
    subject: 'ip',
  })
  @ApiBody({ type: ChallengeInputDto })
  @ApiCreatedResponse({ type: ChallengeDto })
  async challenge(
    @Req() request: AuthRequest,
    @Body(new InputPipe(ChallengeInputSchema)) input: ChallengeInput,
    @Query(new InputPipe(EmptyRequestSchema))
    _query: Record<string, never> = {},
  ) {
    return ChallengeSchema.parse(
      await this.otp.challenge(sessionBinding(request), input.phone),
    );
  }
  @Post('otp/challenges/:challengeId/verify')
  @HttpCode(200)
  @LoginRoute()
  @BrowserMutation()
  @RateLimit({
    key: 'auth.otp.verify',
    maximumHits: 30,
    windowSeconds: 60,
    subject: 'ip',
  })
  @ApiParam({ name: 'challengeId', format: 'uuid' })
  @ApiBody({ type: VerifyInputDto })
  @ApiOkResponse({ type: SessionDto })
  async verify(
    @Req() request: AuthRequest,
    @Param(new InputPipe(ChallengeParamsSchema))
    params: { challengeId: string },
    @Body(new InputPipe(VerifyInputSchema)) input: VerifyInput,
    @Res({ passthrough: true }) response: Response,
    @Query(new InputPipe(EmptyRequestSchema))
    _query: Record<string, never> = {},
  ) {
    const result = await this.otp.verify(
      sessionBinding(request),
      params.challengeId,
      input.code,
    );
    const principal = SessionSchema.parse(result.principal);
    this.cookie.set(
      response,
      result.issued.token,
      result.issued.session.expiresAt,
    );
    return principal;
  }
  @Get('session')
  @OwnAccount()
  @RateLimit({
    key: 'auth.session',
    maximumHits: 120,
    windowSeconds: 60,
    subject: 'principal',
  })
  @ApiOkResponse({ type: SessionDto })
  async session(
    @Req() request: AuthRequest,
    @Query(new InputPipe(EmptyRequestSchema))
    _query: Record<string, never> = {},
  ) {
    return SessionSchema.parse(
      await this.sessions.read(sessionBinding(request)),
    );
  }
  @Post('logout')
  @HttpCode(200)
  @OwnAccount()
  @BrowserMutation()
  @RateLimit({
    key: 'auth.logout',
    maximumHits: 30,
    windowSeconds: 60,
    subject: 'principal',
  })
  @ApiBody({ type: EmptyDto, required: false })
  @ApiOkResponse({ type: LogoutDto })
  async logout(
    @Req() request: AuthRequest,
    @Body(new InputPipe(EmptyRequestSchema.default({})))
    _body: Record<string, never>,
    @Res({ passthrough: true }) response: Response,
    @Query(new InputPipe(EmptyRequestSchema))
    _query: Record<string, never> = {},
  ) {
    await this.sessions.logout(sessionBinding(request));
    this.cookie.clear(response);
    return { loggedOut: true as const };
  }
}
