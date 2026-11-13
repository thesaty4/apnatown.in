import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import { SESSION_ACCESS, type SessionAccess } from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import {
  COMMAND_CONTEXT_FACTORY,
  HttpCommandContextFactory,
} from '../../../shared/idempotency/context';
import {
  COMMAND_UNIT_OF_WORK,
  UNIT_OF_WORK,
  type CommandUnitOfWork,
  type TxContext,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import { BusinessOwnerContext } from '../../businesses/application/business-owner-context';
import type { StoredBusiness } from '../../businesses/domain/business';
import type { VideoOwnerRequest } from '../domain/videos';

const RECEIPT_TTL_MS = 24 * 60 * 60 * 1000;

export interface OwnerCommand {
  name: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  resource: string;
  successStatus: number;
}

/**
 * Owner Gallery/Videos manager access: resolves the caller's own approved
 * vendor/provider business (same rule as `/businesses/me/videos`) inside
 * every read and write transaction, including idempotent replays.
 */
@Injectable()
export class MediaOwnerCommands {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY)
    private readonly contexts: HttpCommandContextFactory,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    private readonly owners: BusinessOwnerContext,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async owner(tx: TxContext, request: VideoOwnerRequest): Promise<StoredBusiness> {
    const principal = await this.sessions.requirePrincipal(tx, request.session);
    if (principal.userId !== request.actorId)
      throw new DomainError('SESSION_EXPIRED');
    const business = await this.owners.resolve(tx, {
      userId: principal.userId,
      ...(request.businessKind ? { kind: request.businessKind } : {}),
    });
    if (
      business.status !== 'approved' ||
      !(await this.owners.sellerRole(tx, business))
    )
      throw new DomainError('USERS_APPROVAL_REQUIRED');
    return business;
  }

  read<T>(
    request: VideoOwnerRequest,
    work: (tx: TxContext, business: StoredBusiness) => Promise<T>,
  ): Promise<T> {
    return this.uow.run(async (tx) => work(tx, await this.owner(tx, request)));
  }

  /** Idempotent owner write; the stored result is re-parsed on replay. */
  run<T extends JsonValue>(
    request: VideoOwnerRequest,
    operation: OwnerCommand,
    payload: unknown,
    work: (tx: TxContext, business: StoredBusiness) => Promise<T>,
    parse: (value: unknown) => T,
  ): Promise<T> {
    const command = this.contexts.create(
      { ...operation, scope: 'principal' },
      {
        actorId: request.actorId,
        correlationId: request.correlationId,
        resource: operation.resource,
        business: null,
        expiresAt: new Date(this.clock.now().getTime() + RECEIPT_TTL_MS),
      },
      {
        key: request.key,
        payload: JSON.parse(
          JSON.stringify({ payload, businessKind: request.businessKind ?? null }),
        ) as JsonValue,
      },
    );
    return this.commands
      .run(
        command,
        async (tx) => parse(await work(tx, await this.owner(tx, request))),
        {
          store: (result) => result,
          replay: async (tx, stored) => {
            await this.owner(tx, request);
            return parse(stored);
          },
        },
      )
      .then(parse);
  }
}
