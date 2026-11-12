import { Inject, Injectable } from '@nestjs/common';
import type { DemoPersona, Principal } from '@apnatown/shared/auth';
import type { SessionBinding } from '../../../shared/auth';
import { DomainError } from '../../../shared/errors/errors';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import {
  USER_IDENTITY,
  type UserIdentityPort,
} from '../../users/application/identity-port';
import { DEMO_PERSONAS } from '../domain/demo-personas';
import { SessionService, type IssuedSession } from './session.service';

/**
 * Local/test-only persona sign-in (docs/adr/0002). Registered only when
 * DEMO_LOGIN_ENABLED outside production. Never creates users or grants roles:
 * the seeded user must be live, active and already hold the persona role.
 */
@Injectable()
export class DemoLoginService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(USER_IDENTITY) private readonly users: UserIdentityPort,
    private readonly sessions: SessionService,
  ) {}

  signIn(
    binding: SessionBinding,
    persona: DemoPersona,
  ): Promise<{ issued: IssuedSession; principal: Principal }> {
    const identity = DEMO_PERSONAS[persona];
    return this.uow.run(async (tx) => {
      const userId = await this.users.findByPhone(tx, identity.phone);
      const principal = userId
        ? await this.users.readPrincipal(tx, userId)
        : null;
      if (!principal?.roles.includes(identity.role))
        throw new DomainError('DEMO_PERSONA_UNAVAILABLE');
      const issued = await this.sessions.replace(tx, binding, principal.userId);
      return { issued, principal };
    });
  }
}
