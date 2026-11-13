import { Global, Module, type DynamicModule } from '@nestjs/common';
import type { RuntimeConfig } from '../../shared/config/config';
import { AUTH_SESSION_PORT, SESSION_ACCESS } from '../../shared/auth';
import { SessionCookie } from '../../shared/auth/cookie';
import { CsrfSynchronizer } from '../../shared/auth/csrf';
import {
  IDENTITY_CRYPTO,
  OTP_CODES,
  NodeIdentityCrypto,
  NodeOtpCodes,
} from '../../shared/auth/crypto';
import { OTP_DELIVERY } from '../../integrations/otp/port';
import { PrivateLocalOtpDelivery } from '../../integrations/otp/private-local';
import { UnavailableOtpDelivery } from '../../integrations/otp/unavailable';
import { SESSION_REPOSITORY } from './domain/session';
import { CHALLENGE_REPOSITORY } from './domain/challenge';
import { CSRF_TOKENS } from './application/csrf-port';
import { AUTH_CLEANUP, AuthCleanupScheduler } from './application/cleanup';
import { OtpService } from './application/otp.service';
import { SessionService } from './application/session.service';
import { PrismaSessionRepository } from './infrastructure/session.repository';
import { PrismaChallengeRepository } from './infrastructure/challenge.repository';
import { PrismaAuthCleanup } from './infrastructure/cleanup.repository';
import { AuthController } from './presentation/auth.controller';
import { DemoLoginController } from './presentation/demo-login.controller';
import { DemoLoginService } from './application/demo-login.service';

@Global()
@Module({})
export class AuthModule {
  static forRoot(
    runtime: DynamicModule,
    config: RuntimeConfig,
    users: DynamicModule,
  ): DynamicModule {
    // Provider selection/credentials, approved TTL/attempt policy and fallback remain release gates.
    // Never start production with a successful-looking local/no-op delivery adapter.
    if (config.APP_ENV === 'production')
      throw new Error('OTP_PROVIDER_NOT_CONFIGURED');
    // Demo persona sign-in (docs/adr/0002) is mounted only on explicit local/test opt-in.
    const demo = config.DEMO_LOGIN_ENABLED;
    return {
      module: AuthModule,
      imports: [runtime, users],
      controllers: demo
        ? [AuthController, DemoLoginController]
        : [AuthController],
      providers: [
        ...(demo ? [DemoLoginService] : []),
        {
          provide: IDENTITY_CRYPTO,
          useFactory: () =>
            new NodeIdentityCrypto(
              config.PII_ENCRYPTION_KEY,
              config.PHONE_LOOKUP_HASH_KEY,
            ),
        },
        {
          provide: OTP_CODES,
          useFactory: () => new NodeOtpCodes(config.OTP_HASH_KEY),
        },
        {
          provide: OTP_DELIVERY,
          useFactory: () =>
            config.OTP_DELIVERY_ADAPTER === 'private-local'
              ? new PrivateLocalOtpDelivery(config.APP_ENV)
              : new UnavailableOtpDelivery(),
        },
        { provide: SESSION_REPOSITORY, useClass: PrismaSessionRepository },
        { provide: CHALLENGE_REPOSITORY, useClass: PrismaChallengeRepository },
        CsrfSynchronizer,
        SessionCookie,
        { provide: CSRF_TOKENS, useExisting: CsrfSynchronizer },
        SessionService,
        OtpService,
        { provide: SESSION_ACCESS, useExisting: SessionService },
        { provide: AUTH_SESSION_PORT, useExisting: SessionService },
        { provide: AUTH_CLEANUP, useClass: PrismaAuthCleanup },
        AuthCleanupScheduler,
      ],
      exports: [
        SessionService,
        SessionCookie,
        CsrfSynchronizer,
        IDENTITY_CRYPTO,
        SESSION_ACCESS,
        AUTH_SESSION_PORT,
      ],
    };
  }
}
