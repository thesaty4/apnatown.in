import { Inject, Injectable } from '@nestjs/common';
import type { AuthSessionPort } from '../../../shared/auth';
import {
  UNIT_OF_WORK,
  type TxContext,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import { SESSION_REPOSITORY, type SessionRepository } from '../domain/session';

/** Auth-owned session revocation for background owners (no HTTP/OTP wiring). */
@Injectable()
export class SessionRevocation implements AuthSessionPort {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}
  revokeUserSessions(input: { userId: string }, tx?: TxContext): Promise<void> {
    const revoke = (transaction: TxContext) =>
      this.sessions.revokeUser(transaction, input.userId, this.clock.now());
    return tx ? revoke(tx) : this.uow.run(revoke);
  }
}
