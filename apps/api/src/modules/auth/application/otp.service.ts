import { Inject, Injectable } from '@nestjs/common';
import { normalizePhone } from '@apnatown/shared/users';
import type { SessionResponse } from '@apnatown/shared/auth';
import type { SessionBinding } from '../../../shared/auth';
import {
  IDENTITY_CRYPTO,
  OTP_CODES,
  type IdentityCrypto,
  type OtpCodes,
} from '../../../shared/auth/crypto';
import {
  RUNTIME_CONFIG,
  type RuntimeConfig,
} from '../../../shared/config/config';
import { DomainError, type ErrorCode } from '../../../shared/errors/errors';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
  type TxContext,
} from '../../../shared/persistence/ports';
import {
  CLOCK,
  ID_PROVIDER,
  type Clock,
  type IdProvider,
} from '../../../shared/runtime/providers';
import {
  OTP_DELIVERY,
  type OtpDeliveryPort,
} from '../../../integrations/otp/port';
import {
  USER_IDENTITY,
  type UserIdentityPort,
} from '../../users/application/identity-port';
import {
  CHALLENGE_REPOSITORY,
  type ChallengeRepository,
  type OtpChallenge,
} from '../domain/challenge';
import { SessionService, type IssuedSession } from './session.service';

type VerificationOutcome =
  | { ok: false; code: ErrorCode }
  | { ok: true; issued: IssuedSession; principal: SessionResponse };

@Injectable()
export class OtpService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(CHALLENGE_REPOSITORY)
    private readonly challenges: ChallengeRepository,
    @Inject(USER_IDENTITY) private readonly users: UserIdentityPort,
    private readonly sessions: SessionService,
    @Inject(IDENTITY_CRYPTO) private readonly crypto: IdentityCrypto,
    @Inject(OTP_CODES) private readonly codes: OtpCodes,
    @Inject(OTP_DELIVERY) private readonly delivery: OtpDeliveryPort,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
  ) {}
  async challenge(binding: SessionBinding, phoneInput: string) {
    const phone = normalizePhone(phoneInput);
    const hash = this.crypto.phoneHash(phone);
    const code = this.codes.generate();
    const challenge = await this.uow.run(async (tx) => {
      // Global order: phone -> session -> challenge -> identity.
      await this.challenges.lockPhone(tx, hash);
      await this.sessions.requireAnonymous(tx, binding);
      const now = this.clock.now();
      await this.checkCooldown(tx, hash, now);
      const id = this.ids.uuidv7();
      const next: OtpChallenge = {
        id,
        phoneCiphertext: this.crypto.encrypt(phone, `challenge:${id}:phone`),
        phoneLookupHash: hash,
        codeHash: this.codes.hash(id, code),
        attemptCount: 0,
        expiresAt: new Date(now.getTime() + this.config.OTP_TTL_SECONDS * 1000),
        resendAfter: new Date(now.getTime() + 30_000),
        verifiedAt: null,
        supersededAt: null,
        createdAt: now,
      };
      await this.challenges.supersedePhone(tx, hash, now);
      await this.challenges.insert(tx, next);
      return next;
    });
    try {
      await this.delivery.send({
        challengeId: challenge.id,
        phone,
        code,
        expiresAt: challenge.expiresAt,
      });
    } catch {
      // Failed delivery still counts toward cooldown/abuse limits and cannot be verified.
      await this.uow.run(async (tx) => {
        await this.challenges.lockPhone(tx, hash);
        await this.challenges.supersede(tx, challenge.id, this.clock.now());
      });
      throw new DomainError('OTP_DELIVERY_FAILED');
    }
    return {
      challengeId: challenge.id,
      resendAfter: challenge.resendAfter.toISOString(),
      expiresAt: challenge.expiresAt.toISOString(),
    };
  }
  async verify(binding: SessionBinding, challengeId: string, code: string) {
    const outcome = await this.uow.run((tx) =>
      this.verifyLocked(tx, binding, challengeId, code),
    );
    // Expected rejections are raised only AFTER attempt/consumption commits.
    // Unexpected exceptions are never caught or converted into committed outcomes.
    if (!outcome.ok) throw new DomainError(outcome.code);
    return outcome;
  }
  private async verifyLocked(
    tx: TxContext,
    binding: SessionBinding,
    id: string,
    code: string,
  ): Promise<VerificationOutcome> {
    const found = await this.challenges.find(tx, id);
    if (!found) return { ok: false, code: 'OTP_NOT_FOUND' };
    await this.challenges.lockPhone(tx, found.phoneLookupHash);
    await this.sessions.requireAnonymous(tx, binding);
    const challenge = await this.challenges.lock(tx, id);
    if (!challenge) return { ok: false, code: 'OTP_NOT_FOUND' };
    const now = this.clock.now();
    if (challenge.verifiedAt || challenge.supersededAt)
      return { ok: false, code: 'OTP_INVALID' };
    if (challenge.expiresAt <= now) return { ok: false, code: 'OTP_EXPIRED' };
    if (challenge.attemptCount >= this.config.OTP_MAX_ATTEMPTS)
      return { ok: false, code: 'OTP_LOCKED' };
    if (!this.codes.verify(id, code, challenge.codeHash)) {
      await this.challenges.failAttempt(tx, id);
      return {
        ok: false,
        code:
          challenge.attemptCount + 1 >= this.config.OTP_MAX_ATTEMPTS
            ? 'OTP_LOCKED'
            : 'OTP_INVALID',
      };
    }
    await this.challenges.consume(tx, id, now);
    const phone = this.crypto.decrypt(
      challenge.phoneCiphertext,
      `challenge:${id}:phone`,
    );
    const principal = await this.users.resolveVerifiedPhone(tx, phone);
    if (!principal) return { ok: false, code: 'ACCOUNT_UNAVAILABLE' };
    const issued = await this.sessions.rotate(tx, binding, principal);
    return {
      ok: true,
      issued,
      principal: {
        ...principal,
        expiresAt: issued.session.expiresAt.toISOString(),
      },
    };
  }
  private async checkCooldown(
    tx: TxContext,
    hash: Uint8Array,
    now: Date,
  ): Promise<void> {
    const latest = await this.challenges.latest(tx, hash);
    if (latest && latest.resendAfter > now)
      throw new DomainError(
        'OTP_RATE_LIMITED',
        {},
        Math.min(
          30,
          Math.max(
            1,
            Math.ceil((latest.resendAfter.getTime() - now.getTime()) / 1000),
          ),
        ),
      );
    if (
      (await this.challenges.countSince(
        tx,
        hash,
        new Date(now.getTime() - 3_600_000),
      )) >= this.config.OTP_PHONE_REQUESTS_PER_HOUR
    )
      throw new DomainError('OTP_RATE_LIMITED');
  }
}
