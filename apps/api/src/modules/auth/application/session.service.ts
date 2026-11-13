import { Inject, Injectable } from '@nestjs/common';
import type { Principal, SessionResponse } from '@apnatown/shared/auth';
import type {
  AuthSessionPort,
  SessionAccess,
  SessionBinding,
} from '../../../shared/auth';
import {
  RUNTIME_CONFIG,
  type RuntimeConfig,
} from '../../../shared/config/config';
import { DomainError } from '../../../shared/errors/errors';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
  type TxContext,
} from '../../../shared/persistence/ports';
import {
  OPAQUE_TOKENS,
  InvalidOpaqueTokenError,
  type OpaqueTokens,
} from '../../../shared/runtime/opaque-token';
import {
  CLOCK,
  ID_PROVIDER,
  type Clock,
  type IdProvider,
} from '../../../shared/runtime/providers';
import {
  USER_IDENTITY,
  type UserIdentityPort,
} from '../../users/application/identity-port';
import {
  SESSION_REPOSITORY,
  type SessionRepository,
  type StoredSession,
} from '../domain/session';
import { CSRF_TOKENS, type CsrfTokens } from './csrf-port';

export interface IssuedSession {
  session: StoredSession;
  token: string;
}

@Injectable()
export class SessionService implements SessionAccess, AuthSessionPort {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    @Inject(USER_IDENTITY) private readonly users: UserIdentityPort,
    @Inject(OPAQUE_TOKENS) private readonly tokens: OpaqueTokens,
    @Inject(CSRF_TOKENS) private readonly csrf: CsrfTokens,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
  ) {}
  bootstrap(
    token: unknown,
  ): Promise<{ session: StoredSession; token?: string }> {
    return this.uow.run(async (tx) => {
      const existing = await this.byToken(tx, token);
      if (existing?.kind === 'authenticated') {
        await this.requirePrincipal(tx, existing);
        return { session: existing };
      }
      if (existing && this.live(existing)) return { session: existing };
      return this.issue(tx, null);
    });
  }
  resolve(
    token: unknown,
  ): Promise<{ session: StoredSession; principal?: Principal } | null> {
    return this.uow.run(async (tx) => {
      const session = await this.byToken(tx, token);
      if (!session || !this.live(session)) return null;
      if (session.kind === 'anonymous') return { session };
      const principal = await this.requirePrincipal(tx, session);
      return { session, principal };
    });
  }
  async requireAnonymous(
    tx: TxContext,
    binding: SessionBinding,
  ): Promise<StoredSession> {
    const session = await this.lockBinding(tx, binding);
    if (session.kind !== 'anonymous') throw new DomainError('COMMON_FORBIDDEN');
    return session;
  }
  async requirePrincipal(
    tx: TxContext,
    binding: SessionBinding,
  ): Promise<Principal> {
    const session = await this.lockBinding(tx, binding);
    if (session.kind !== 'authenticated' || !session.userId)
      throw new DomainError('SESSION_EXPIRED');
    const principal = await this.users.readPrincipal(tx, session.userId);
    if (!principal) throw new DomainError('ACCOUNT_UNAVAILABLE');
    return principal;
  }
  read(binding: SessionBinding): Promise<SessionResponse> {
    return this.uow.run(async (tx) => {
      const principal = await this.requirePrincipal(tx, binding);
      const session = await this.lockBinding(tx, binding);
      await this.sessions.touch(tx, session.id, this.clock.now());
      return { ...principal, expiresAt: session.expiresAt.toISOString() };
    });
  }
  logout(binding: SessionBinding): Promise<void> {
    return this.uow.run(async (tx) => {
      await this.requirePrincipal(tx, binding);
      await this.sessions.revoke(tx, binding.id, this.clock.now());
    });
  }
  revokeUserSessions(input: { userId: string }, tx?: TxContext): Promise<void> {
    const revoke = (transaction: TxContext) =>
      this.sessions.revokeUser(transaction, input.userId, this.clock.now());
    return tx ? revoke(tx) : this.uow.run(revoke);
  }
  async rotate(
    tx: TxContext,
    old: SessionBinding,
    principal: Principal,
  ): Promise<IssuedSession> {
    await this.requireAnonymous(tx, old);
    await this.sessions.revoke(tx, old.id, this.clock.now());
    return this.issue(tx, principal.userId);
  }
  /**
   * Demo persona switch (docs/adr/0002): replaces a live session of any kind.
   * Inert unless the demo flag is on outside production. Locks the session
   * before `select` reads identity, matching resolve/requirePrincipal order.
   */
  async replace(
    tx: TxContext,
    old: SessionBinding,
    select: (tx: TxContext) => Promise<Principal>,
  ): Promise<{ issued: IssuedSession; principal: Principal }> {
    if (this.config.APP_ENV === 'production' || !this.config.DEMO_LOGIN_ENABLED)
      throw new DomainError('COMMON_NOT_FOUND');
    await this.lockBinding(tx, old);
    const principal = await select(tx);
    await this.sessions.revoke(tx, old.id, this.clock.now());
    return { issued: await this.issue(tx, principal.userId), principal };
  }
  private async issue(
    tx: TxContext,
    userId: string | null,
  ): Promise<IssuedSession> {
    const issued = this.tokens.issue('session');
    const now = this.clock.now();
    const ttl = userId
      ? this.config.SESSION_TTL_SECONDS
      : this.config.ANONYMOUS_SESSION_TTL_SECONDS;
    const session: StoredSession = {
      id: this.ids.uuidv7(),
      kind: userId ? 'authenticated' : 'anonymous',
      userId,
      tokenHash: issued.hash,
      csrfToken: this.csrf.generate(),
      createdAt: now,
      expiresAt: new Date(now.getTime() + ttl * 1000),
      revokedAt: null,
      lastSeenAt: now,
    };
    await this.sessions.insert(tx, session);
    return { session, token: issued.token };
  }
  private async lockBinding(
    tx: TxContext,
    binding: SessionBinding,
  ): Promise<StoredSession> {
    const session = await this.sessions.lock(tx, binding.id);
    if (!session || !this.live(session))
      throw new DomainError('SESSION_EXPIRED');
    if (binding.csrfToken !== session.csrfToken)
      throw new DomainError('CSRF_INVALID');
    return session;
  }
  private live(session: StoredSession): boolean {
    return (
      !session.revokedAt &&
      session.expiresAt.getTime() > this.clock.now().getTime()
    );
  }
  private async byToken(
    tx: TxContext,
    token: unknown,
  ): Promise<StoredSession | null> {
    if (typeof token !== 'string') return null;
    let hash: Uint8Array;
    try {
      hash = this.tokens.hash('session', token);
    } catch (error) {
      if (error instanceof InvalidOpaqueTokenError) return null;
      throw error;
    }
    return this.sessions.findByHash(tx, hash);
  }
}
