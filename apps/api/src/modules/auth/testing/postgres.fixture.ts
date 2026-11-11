import { randomBytes } from 'node:crypto';
import { NodeIdentityCrypto, NodeOtpCodes } from '../../../shared/auth/crypto';
import { CsrfSynchronizer } from '../../../shared/auth/csrf';
import { SessionCookie } from '../../../shared/auth/cookie';
import { parseConfig } from '../../../shared/config/config';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import { PrismaUnitOfWork } from '../../../shared/persistence/unit-of-work';
import {
  SystemClock,
  SystemIdProvider,
} from '../../../shared/runtime/providers';
import { SystemOpaqueTokens } from '../../../shared/runtime/opaque-token';
import type { OtpDeliveryPort } from '../../../integrations/otp/port';
import { PrismaUsersRepository } from '../../users/infrastructure/users.repository';
import { IdentityService } from '../../users/application/identity.service';
import { ProfileService } from '../../users/application/profile.service';
import { UsersController } from '../../users/presentation/users.controller';
import { PrismaSessionRepository } from '../infrastructure/session.repository';
import { PrismaChallengeRepository } from '../infrastructure/challenge.repository';
import { SessionService } from '../application/session.service';
import { OtpService } from '../application/otp.service';
import { AuthController } from '../presentation/auth.controller';

/** Explicit, pre-migrated disposable database only. No reset, seed, listen or .env loading. */
export function postgresFixture(url: string) {
  const parsed = new URL(url);
  if (
    !['127.0.0.1', 'localhost'].includes(parsed.hostname) ||
    !/^\/apnatown_test_auth_[a-z0-9_]+$/.test(parsed.pathname)
  )
    throw new Error('ISOLATED_AUTH_TEST_DATABASE_REQUIRED');
  const config = parseConfig({
    APP_ENV: 'test',
    DATABASE_URL: url,
    WEB_ORIGIN: 'http://localhost:3000',
    CURSOR_SIGNING_KEY: randomBytes(32).toString('hex'),
    IDEMPOTENCY_HASH_KEY: randomBytes(32).toString('hex'),
    PII_ENCRYPTION_KEY: randomBytes(32).toString('hex'),
    PHONE_LOOKUP_HASH_KEY: randomBytes(32).toString('hex'),
    OTP_HASH_KEY: randomBytes(32).toString('hex'),
    ANONYMOUS_SESSION_TTL_SECONDS: '900',
    SESSION_TTL_SECONDS: '3600',
    OTP_TTL_SECONDS: '300',
    OTP_MAX_ATTEMPTS: '3',
    OTP_PHONE_REQUESTS_PER_HOUR: '10',
    OTP_DELIVERY_ADAPTER: 'unavailable',
  });
  const db = new PrismaDatabase({ connectionString: url });
  const observer = new PrismaDatabase({ connectionString: url });
  const uow = new PrismaUnitOfWork(db);
  const clock = new SystemClock();
  const ids = new SystemIdProvider(clock);
  const crypto = new NodeIdentityCrypto(
    config.PII_ENCRYPTION_KEY,
    config.PHONE_LOOKUP_HASH_KEY,
  );
  const codes = new NodeOtpCodes(config.OTP_HASH_KEY);
  const users = new PrismaUsersRepository(db);
  const identity = new IdentityService(users, crypto, clock, ids);
  const sessions = new SessionService(
    uow,
    new PrismaSessionRepository(db),
    identity,
    new SystemOpaqueTokens(),
    new CsrfSynchronizer(),
    clock,
    ids,
    config,
  );
  const sent = new Map<string, Parameters<OtpDeliveryPort['send']>[0]>();
  const delivery = {
    failing: false,
    async send(input: Parameters<OtpDeliveryPort['send']>[0]) {
      if (this.failing) throw new Error('synthetic provider outage');
      sent.set(input.challengeId, input);
    },
  };
  const otp = new OtpService(
    uow,
    new PrismaChallengeRepository(db),
    identity,
    sessions,
    crypto,
    codes,
    delivery,
    clock,
    ids,
    config,
  );
  const profiles = new ProfileService(uow, users, sessions, crypto, clock);
  return {
    config,
    db,
    observer,
    uow,
    crypto,
    codes,
    sessions,
    otp,
    profiles,
    sent,
    delivery,
    authController: new AuthController(
      sessions,
      otp,
      new SessionCookie(config),
    ),
    usersController: new UsersController(profiles),
    async close() {
      await Promise.all([db.disconnect(), observer.disconnect()]);
      sent.clear();
    },
  };
}
