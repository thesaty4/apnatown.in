import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '../../../shared/auth/auth.guard';
import { SessionCookie } from '../../../shared/auth/cookie';
import { CsrfSynchronizer } from '../../../shared/auth/csrf';
import type { AuthRequest } from '../../../shared/auth/request';
import { DomainError } from '../../../shared/errors/errors';
import { Prisma } from '../../../shared/persistence/generated/client';
import { AuthController } from '../presentation/auth.controller';
import { postgresFixture } from './postgres.fixture';

const url = process.env.AUTH_TEST_DATABASE_URL;
const phone = () =>
  `6${randomInt(0, 1_000_000_000).toString().padStart(9, '0')}`;
const hasCode = (code: string) => (error: unknown) =>
  error instanceof DomainError && error.code === code;

test(
  'PostgreSQL Auth flow, commit-on-rejection, replay, live identity and private own-account access',
  { skip: !url },
  async () => {
    const h = postgresFixture(url!);
    try {
      const anonymous = await h.sessions.bootstrap(undefined);
      const binding = anonymous.session;
      const request = { authSession: binding } as unknown as AuthRequest;
      const number = phone();
      const challenge = await h.authController.challenge(request, {
        phone: number,
      });
      assert.deepEqual(Object.keys(challenge).sort(), [
        'challengeId',
        'expiresAt',
        'resendAfter',
      ]);
      await assert.rejects(
        h.otp.challenge(binding, `+91${number}`),
        hasCode('OTP_RATE_LIMITED'),
      );
      assert.equal(h.sent.size, 1);
      const sent = h.sent.get(challenge.challengeId)!;
      const wrong = `${(Number(sent.code[0]) + 1) % 10}${sent.code.slice(1)}`;
      await assert.rejects(
        h.otp.verify(binding, challenge.challengeId, wrong),
        hasCode('OTP_INVALID'),
      );
      await h.observer.connect();
      const attempts = await h.observer.queryRaw<
        { attempt_count: number }[]
      >(Prisma.sql`
      SELECT attempt_count FROM otp_challenges WHERE id = ${challenge.challengeId}::uuid`);
      assert.equal(attempts[0]?.attempt_count, 1); // independent connection sees the rejected write
      const raced = await Promise.allSettled([
        h.otp.verify(binding, challenge.challengeId, sent.code),
        h.otp.verify(binding, challenge.challengeId, sent.code),
      ]);
      assert.equal(
        raced.filter((result) => result.status === 'fulfilled').length,
        1,
      );
      const success = raced.find((result) => result.status === 'fulfilled');
      assert.ok(success?.status === 'fulfilled');
      const authenticated = success.value.issued;
      assert.notEqual(authenticated.token, anonymous.token);
      assert.notEqual(authenticated.session.csrfToken, binding.csrfToken);
      assert.equal(await h.sessions.resolve(anonymous.token), null);
      await assert.rejects(
        h.sessions.read(binding),
        hasCode('SESSION_EXPIRED'),
      );
      const principal = await h.sessions.read(authenticated.session);
      assert.deepEqual(principal.roles, ['customer']);
      assert.equal(principal.approvalStates.businesses, 'unavailable');
      const own = {
        authSession: authenticated.session,
      } as unknown as AuthRequest;
      const updated = await h.usersController.updateProfile(own, {
        displayName: 'Synthetic Account',
        email: 'synthetic@example.invalid',
      });
      assert.equal(updated.userId, principal.userId);
      assert.equal(updated.email, 'synthetic@example.invalid');
      assert.deepEqual(
        await h.usersController.updatePreferences(own, {
          locale: 'hi',
          theme: 'auto',
        }),
        { locale: 'hi', theme: 'auto' },
      );
      await h.uow.run(async (tx) => {
        await h.db
          .client(tx)
          .userRole.deleteMany({ where: { userId: principal.userId } });
      });
      assert.deepEqual(
        (await h.sessions.read(authenticated.session)).roles,
        [],
      );
      await h.uow.run(async (tx) => {
        await h.db
          .client(tx)
          .user.update({
            where: { id: principal.userId },
            data: { accountStatus: 'suspended' },
          });
      });
      await assert.rejects(
        h.sessions.read(authenticated.session),
        hasCode('ACCOUNT_UNAVAILABLE'),
      );
      await assert.rejects(
        h.profiles.updateProfile(authenticated.session, {
          displayName: 'Denied',
        }),
        hasCode('ACCOUNT_UNAVAILABLE'),
      );
      // A valid challenge for this blocked identity is consumed, with no fresh session.
      const other = await h.sessions.bootstrap(undefined);
      await h.uow.run(async (tx) => {
        await h.db
          .client(tx)
          .otpChallenge.update({
            where: { id: challenge.challengeId },
            data: { resendAfter: new Date(Date.now() - 1) },
          });
      });
      const blockedChallenge = await h.otp.challenge(other.session, number);
      await assert.rejects(
        h.otp.verify(
          other.session,
          blockedChallenge.challengeId,
          h.sent.get(blockedChallenge.challengeId)!.code,
        ),
        hasCode('ACCOUNT_UNAVAILABLE'),
      );
      const consumed = await h.observer.queryRaw<
        { verified_at: Date | null }[]
      >(Prisma.sql`
      SELECT verified_at FROM otp_challenges WHERE id = ${blockedChallenge.challengeId}::uuid`);
      assert.ok(consumed[0]?.verified_at);
      assert.equal(
        (await h.sessions.resolve(other.token))?.session.kind,
        'anonymous',
      );
      // Unexpected failure rolls back: ordinary UoW never commits on thrown exceptions.
      await assert.rejects(
        h.uow.run(async (tx) => {
          await h.db
            .client(tx)
            .otpChallenge.update({
              where: { id: blockedChallenge.challengeId },
              data: { attemptCount: 9 },
            });
          throw new Error('synthetic failure');
        }),
      );
      const rolledBack = await h.observer.queryRaw<
        { attempt_count: number }[]
      >(Prisma.sql`
      SELECT attempt_count FROM otp_challenges WHERE id = ${blockedChallenge.challengeId}::uuid`);
      assert.equal(rolledBack[0]?.attempt_count, 0);
    } finally {
      await h.close();
    }
  },
);

test(
  'Guest/protected guard negatives, expiry, locked codes and logout persist without an HTTP listener',
  { skip: !url },
  async () => {
    const h = postgresFixture(url!);
    try {
      const anon = await h.sessions.bootstrap(undefined);
      await assert.rejects(
        h.sessions.read(anon.session),
        hasCode('SESSION_EXPIRED'),
      );
      const c = await h.otp.challenge(anon.session, phone());
      const code = h.sent.get(c.challengeId)!.code;
      const wrong = `${(Number(code[0]) + 1) % 10}${code.slice(1)}`;
      for (let i = 0; i < 3; i++)
        await assert.rejects(
          h.otp.verify(anon.session, c.challengeId, wrong),
          hasCode(i === 2 ? 'OTP_LOCKED' : 'OTP_INVALID'),
        );
      await assert.rejects(
        h.otp.verify(anon.session, c.challengeId, code),
        hasCode('OTP_LOCKED'),
      );
      const next = await h.otp.challenge(anon.session, phone());
      const valid = await h.otp.verify(
        anon.session,
        next.challengeId,
        h.sent.get(next.challengeId)!.code,
      );
      const csrf = new CsrfSynchronizer();
      const guard = new AuthGuard(
        new Reflector(),
        h.sessions,
        new SessionCookie(h.config),
        csrf,
        h.config,
      );
      const request = {
        method: 'POST',
        query: {},
        cookies: { apnatown_session: valid.issued.token },
        headers: { origin: h.config.WEB_ORIGIN },
      } as unknown as AuthRequest;
      const context = {
        getClass: () => AuthController,
        getHandler: () => AuthController.prototype.logout,
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({ setHeader() {} }),
        }),
      } as unknown as ExecutionContext;
      await assert.rejects(guard.canActivate(context), hasCode('CSRF_INVALID'));
      assert.ok(await h.sessions.resolve(valid.issued.token));
      request.headers['x-csrf-token'] = valid.issued.session.csrfToken;
      request.headers.origin = 'https://invalid.example';
      await assert.rejects(guard.canActivate(context), hasCode('CSRF_INVALID'));
      request.headers.origin = h.config.WEB_ORIGIN;
      assert.equal(await guard.canActivate(context), true);
      let cleared = false;
      await h.authController.logout(request, {}, {
        clearCookie() {
          cleared = true;
        },
      } as unknown as Response);
      assert.equal(cleared, true);
      assert.equal(await h.sessions.resolve(valid.issued.token), null);
      const expiring = await h.sessions.bootstrap(undefined);
      await h.uow.run(async (tx) => {
        const past = new Date(Date.now() - 1000);
        await h.db
          .client(tx)
          .session.update({
            where: { id: expiring.session.id },
            data: {
              createdAt: new Date(past.getTime() - 1000),
              expiresAt: past,
            },
          });
      });

      test(
        'Provider failure, expiry and resend races fail closed; bootstrap state survives independent readers',
        { skip: !url },
        async () => {
          const h = postgresFixture(url!);
          try {
            const anonymous = await h.sessions.bootstrap(undefined);
            const bootstraps = await Promise.all([
              h.sessions.bootstrap(anonymous.token),
              h.sessions.bootstrap(anonymous.token),
            ]);
            assert.ok(
              bootstraps.every(
                (result) =>
                  result.session.csrfToken === anonymous.session.csrfToken &&
                  !result.token,
              ),
            );
            await h.observer.connect();
            const state = await h.observer.queryRaw<
              { csrf_token: string; token_hash: Uint8Array }[]
            >(Prisma.sql`
          SELECT csrf_token, token_hash FROM sessions WHERE id = ${anonymous.session.id}::uuid`);
            assert.equal(state[0]?.csrf_token, anonymous.session.csrfToken);
            assert.equal(state[0]?.token_hash.byteLength, 32);
            await assert.rejects(
              h.otp.verify(anonymous.session, randomUUID(), h.codes.generate()),
              hasCode('OTP_NOT_FOUND'),
            );
            h.delivery.failing = true;
            const outagePhone = phone();
            await assert.rejects(
              h.otp.challenge(anonymous.session, outagePhone),
              hasCode('OTP_DELIVERY_FAILED'),
            );
            await assert.rejects(
              h.otp.challenge(anonymous.session, outagePhone),
              hasCode('OTP_RATE_LIMITED'),
            );
            h.delivery.failing = false;
            const number = phone();
            const race = await Promise.allSettled([
              h.otp.challenge(anonymous.session, number),
              h.otp.challenge(anonymous.session, `+91${number}`),
            ]);
            assert.equal(
              race.filter((result) => result.status === 'fulfilled').length,
              1,
            );
            const issued = race.find((result) => result.status === 'fulfilled');
            assert.ok(issued?.status === 'fulfilled');
            const id = issued.value.challengeId;
            const firstCode = h.sent.get(id)!.code;
            await h.uow.run(async (tx) => {
              const now = new Date();
              await h.db.client(tx).otpChallenge.update({
                where: { id },
                data: {
                  createdAt: new Date(now.getTime() - 60_000),
                  resendAfter: new Date(now.getTime() - 30_000),
                },
              });
            });
            const resend = await h.otp.challenge(anonymous.session, number);
            await assert.rejects(
              h.otp.verify(anonymous.session, id, firstCode),
              hasCode('OTP_INVALID'),
            );
            await h.uow.run(async (tx) => {
              const past = new Date(Date.now() - 1000);
              await h.db.client(tx).otpChallenge.update({
                where: { id: resend.challengeId },
                data: {
                  createdAt: new Date(past.getTime() - 60_000),
                  resendAfter: new Date(past.getTime() - 30_000),
                  expiresAt: past,
                },
              });
            });
            await assert.rejects(
              h.otp.verify(
                anonymous.session,
                resend.challengeId,
                h.sent.get(resend.challengeId)!.code,
              ),
              hasCode('OTP_EXPIRED'),
            );
            assert.equal(
              (await h.sessions.resolve(anonymous.token))?.session.kind,
              'anonymous',
            );
          } finally {
            await h.close();
          }
        },
      );
      assert.equal(await h.sessions.resolve(expiring.token), null);
    } finally {
      await h.close();
    }
  },
);
