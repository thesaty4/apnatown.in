import { Inject, Injectable } from '@nestjs/common';
import type { Principal } from '@apnatown/shared/auth';
import type { SessionBinding } from '../../../shared/auth';
import {
  SESSION_ACCESS,
  type SessionAccess,
} from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';
import {
  RIDER_REPOSITORY,
  type RiderRepository,
  type StoredRider,
} from '../domain/rider';

/** Authenticated own-account request; the rider is always the session user. */
export interface RiderRequest {
  session: SessionBinding;
  actorId: string;
}
export interface RiderCommand extends RiderRequest {
  correlationId: string;
  key: unknown;
}

/**
 * In-transaction rider re-authorization. Roles/approval are read live on
 * every call (suspension denies operational capability immediately); the
 * route guard's role check is never the only gate.
 */
@Injectable()
export class RiderAccess {
  constructor(
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(RIDER_REPOSITORY) private readonly riders: RiderRepository,
  ) {}

  /** Live session bound to the caller (any authenticated applicant). */
  async principal(tx: TxContext, request: RiderRequest): Promise<Principal> {
    const principal = await this.sessions.requirePrincipal(tx, request.session);
    if (principal.userId !== request.actorId)
      throw new DomainError('SESSION_EXPIRED');
    return principal;
  }

  /** Live rider role plus an existing profile row (any approval status). */
  async rider(
    tx: TxContext,
    request: RiderRequest,
    lock = false,
  ): Promise<StoredRider> {
    const principal = await this.principal(tx, request);
    if (!principal.roles.includes('rider'))
      throw new DomainError('COMMON_FORBIDDEN');
    const rider = await this.riders.find(tx, principal.userId, lock);
    if (!rider) throw new DomainError('RIDER_NOT_APPROVED');
    return rider;
  }

  /** Live rider role and a currently approved application (BR-06). */
  async approved(
    tx: TxContext,
    request: RiderRequest,
    lock = false,
  ): Promise<StoredRider> {
    const rider = await this.rider(tx, request, lock);
    if (rider.status !== 'approved') throw new DomainError('RIDER_NOT_APPROVED');
    return rider;
  }
}
