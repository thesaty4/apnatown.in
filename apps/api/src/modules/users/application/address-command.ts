import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import type { SessionBinding } from '../../../shared/auth';
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
import { AddressAccess } from './address-access';
import { AddressProjection, type AddressResult } from './address-projection';

export interface AddressCommand {
  session: SessionBinding;
  actorId: string;
  correlationId: string;
  key: unknown;
}
// Local retry horizon, not a production retention policy; see Users implementation note.
const RECEIPT_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AddressCommands {
  constructor(
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY)
    private readonly contexts: HttpCommandContextFactory,
    private readonly access: AddressAccess,
    private readonly projection: AddressProjection,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}
  run(
    request: AddressCommand,
    method: 'POST' | 'PATCH' | 'DELETE',
    id: string | null,
    payload: JsonValue,
    work: (tx: TxContext, userId: string) => Promise<AddressResult>,
  ): Promise<AddressResult> {
    const command = this.contexts.create(
      {
        name: `users.addresses.${method.toLowerCase()}`,
        method,
        scope: 'principal',
        successStatus: method === 'POST' ? 201 : 200,
      },
      {
        actorId: request.actorId,
        correlationId: request.correlationId,
        resource: `/users/me/addresses${id === null ? '' : `/${id}`}`,
        business: null,
        expiresAt: new Date(this.clock.now().getTime() + RECEIPT_TTL_MS),
      },
      { key: request.key, payload },
    );
    return this.commands.run(
      command,
      async (tx) => {
        const userId = await this.access.own(
          tx,
          request.session,
          command.actor.id,
        );
        return work(tx, userId);
      },
      {
        store: (result) =>
          this.projection.store(result, command.actor.id, command.operation),
        replay: async (tx, stored) => {
          const userId = await this.access.own(
            tx,
            request.session,
            command.actor.id,
          );
          const receipt = this.projection.receipt(stored);
          if (id !== null && receipt.id !== id)
            throw new Error('INVALID_ADDRESS_RECEIPT');
          await this.access.address(tx, userId, receipt.id, true);
          return this.projection.replay(
            stored,
            userId,
            command.operation,
            method === 'DELETE',
          );
        },
      },
    );
  }
}
