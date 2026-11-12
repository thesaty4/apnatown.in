import { Module, type DynamicModule } from '@nestjs/common';
import { AUTH_SESSION_PORT } from '../../shared/auth';
import { SESSION_REPOSITORY } from './domain/session';
import { SessionRevocation } from './application/session-revocation';
import { PrismaSessionRepository } from './infrastructure/session.repository';

/**
 * Worker-safe slice of Auth exposing only AuthSessionPort. The full AuthModule
 * (HTTP, OTP delivery, cookies) is never loaded by the worker.
 */
@Module({})
export class AuthSessionsModule {
  static forRoot(runtime: DynamicModule): DynamicModule {
    return {
      module: AuthSessionsModule,
      imports: [runtime],
      providers: [
        { provide: SESSION_REPOSITORY, useClass: PrismaSessionRepository },
        SessionRevocation,
        { provide: AUTH_SESSION_PORT, useExisting: SessionRevocation },
      ],
      exports: [AUTH_SESSION_PORT],
    };
  }
}
