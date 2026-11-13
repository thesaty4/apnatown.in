import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import type { SessionBinding } from '../../../shared/auth';
import { SESSION_ACCESS, type SessionAccess } from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import {
  COMMAND_CONTEXT_FACTORY,
  HttpCommandContextFactory,
} from '../../../shared/idempotency/context';
import {
  COMMAND_UNIT_OF_WORK,
  type CommandUnitOfWork,
  type TxContext,
} from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import {
  USER_IDENTITY,
  type UserIdentityPort,
} from '../../users/application/identity-port';
import type { AuditActor } from '../../audit/application/audit-writer.port';

export interface AdminCommand {
  session: SessionBinding;
  actorId: string;
  correlationId: string;
  key: unknown;
}
export interface SuperActor extends AuditActor {
  readonly userId: string;
  readonly role: 'super_admin';
}
// Local retry horizon, not a production retention policy (mirrors Users).
const RECEIPT_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Super-admin command boundary: idempotency receipt, in-transaction session
 * and super_admin recheck (also on replay), and the audit actor.
 */
@Injectable()
export class AdminCommands {
  constructor(
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY)
    private readonly contexts: HttpCommandContextFactory,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(USER_IDENTITY) private readonly identity: UserIdentityPort,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  run<T extends JsonValue>(
    request: AdminCommand,
    operation: {
      name: string;
      method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      resource: string;
      successStatus: number;
    },
    payload: object,
    work: (tx: TxContext, actor: SuperActor) => Promise<T>,
    receipt: {
      store(result: T): JsonValue;
      replay(tx: TxContext, stored: JsonValue, actor: SuperActor): Promise<T>;
    },
  ): Promise<T> {
    const command = this.contexts.create(
      {
        name: operation.name,
        method: operation.method,
        scope: 'principal',
        successStatus: operation.successStatus,
      },
      {
        actorId: request.actorId,
        correlationId: request.correlationId,
        resource: operation.resource,
        business: null,
        expiresAt: new Date(this.clock.now().getTime() + RECEIPT_TTL_MS),
      },
      // Wire input is JSON; absent optional fields are dropped.
      {
        key: request.key,
        payload: JSON.parse(JSON.stringify(payload)) as JsonValue,
      },
    );
    return this.commands.run(
      command,
      async (tx) => work(tx, await this.requireSuper(tx, request)),
      {
        store: (result) => receipt.store(result),
        replay: async (tx, stored) =>
          receipt.replay(tx, stored, await this.requireSuper(tx, request)),
      },
    );
  }

  private async requireSuper(
    tx: TxContext,
    request: AdminCommand,
  ): Promise<SuperActor> {
    const principal = await this.sessions.requirePrincipal(tx, request.session);
    if (
      principal.userId !== request.actorId ||
      !principal.roles.includes('super_admin')
    )
      throw new DomainError('COMMON_FORBIDDEN');
    const [profile] = await this.identity.describe(tx, [principal.userId]);
    return {
      userId: principal.userId,
      role: 'super_admin',
      label: profile?.displayName ?? 'Super admin',
    };
  }
}
