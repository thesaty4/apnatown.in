import { Inject, Injectable } from '@nestjs/common';
import { SupportMessageExportSchema } from '@apnatown/shared/users';
import { IdSchema, TimestampSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  UserDataErasure,
  UserDataExportPage,
  UserDataPort,
} from '../../users/application/user-data-port';
import {
  SUPPORT_MESSAGE_REPOSITORY,
  type SupportMessageRepository,
} from '../domain/settings';

// Internal keyset cursor: `<timestamp>|<uuid>`; never client input.
const positionSchema = z
  .string()
  .transform((value) => value.split('|'))
  .pipe(z.tuple([TimestampSchema, IdSchema]));

/**
 * SettingsUserDataPort: own account-linked support intake only. Anonymous
 * messages are never attached by guessing. Retention/anonymisation is gated
 * by Q-32/Q-13, so erasure blocks while account-linked messages exist.
 */
@Injectable()
export class SupportDataOwner implements UserDataPort {
  readonly section = 'support_messages' as const;
  constructor(
    @Inject(SUPPORT_MESSAGE_REPOSITORY)
    private readonly messages: SupportMessageRepository,
  ) {}

  async exportPage(
    input: { userId: string; cursor: string | null; limit: number },
    tx: TxContext,
  ): Promise<UserDataExportPage> {
    const limit = Math.min(50, Math.max(1, input.limit));
    const after =
      input.cursor === null ? undefined : positionSchema.parse(input.cursor);
    const rows = await this.messages.pageByUser(
      tx,
      input.userId,
      limit + 1,
      after && { createdAt: after[0], id: after[1] },
    );
    const page = rows.slice(0, limit);
    const last = page.at(-1);
    return {
      items: page.map((row) =>
        SupportMessageExportSchema.parse({
          id: row.id,
          message: row.message,
          createdAt: row.createdAt,
        }),
      ),
      nextCursor:
        rows.length > limit && last ? `${last.createdAt}|${last.id}` : null,
    };
  }

  async erase(
    input: { userId: string; requestId: string; policyVersion: string },
    tx: TxContext,
  ): Promise<UserDataErasure> {
    const receipt = `settings.support_messages:${input.requestId}`;
    // TODO(verify): Q-32/Q-13 support-message retention/anonymisation policy.
    if (await this.messages.existsForUser(tx, input.userId))
      return {
        receipt,
        status: 'blocked',
        reasonCode: 'RETENTION_POLICY_PENDING',
      };
    return { receipt, status: 'completed' };
  }
}
