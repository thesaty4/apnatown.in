import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import {
  ConsentRecordSchema,
  DataExportProfileSchema,
} from '@apnatown/shared/users';
import { IdSchema, TimestampSchema } from '@apnatown/shared/wire';
import {
  IDENTITY_CRYPTO,
  type IdentityCrypto,
} from '../../../shared/auth/crypto';
import type { TxContext } from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import { ADDRESS_REPOSITORY, type AddressRepository } from '../domain/address';
import { CONSENT_REPOSITORY, type ConsentRepository } from '../domain/consent';
import { USERS_REPOSITORY, type UsersRepository } from '../domain/identity';
import { AddressProjection } from './address-projection';
import type {
  UserDataErasure,
  UserDataExportPage,
  UserDataPort,
} from './user-data-port';

// Internal keyset cursor: `<timestamp>|<uuid>`; validated, never client input.
const positionSchema = z
  .string()
  .transform((value) => value.split('|'))
  .pipe(z.tuple([TimestampSchema, IdSchema]));
function position(cursor: string | null) {
  if (cursor === null) return undefined;
  const [at, id] = positionSchema.parse(cursor);
  return { at, id };
}

/** Users profile + preferences. */
@Injectable()
export class ProfileDataOwner implements UserDataPort {
  readonly section = 'profile' as const;
  constructor(
    @Inject(USERS_REPOSITORY) private readonly users: UsersRepository,
    @Inject(IDENTITY_CRYPTO) private readonly crypto: IdentityCrypto,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}
  async exportPage(
    input: { userId: string },
    tx: TxContext,
  ): Promise<UserDataExportPage> {
    const user = await this.users.lock(tx, input.userId);
    if (!user?.phoneCiphertext) throw new Error('USER_DATA_SUBJECT_MISSING');
    const profile = DataExportProfileSchema.parse({
      userId: user.id,
      phone: this.crypto.decrypt(user.phoneCiphertext, `user:${user.id}:phone`),
      displayName: user.displayName,
      email: user.emailCiphertext
        ? this.crypto.decrypt(user.emailCiphertext, `user:${user.id}:email`)
        : null,
      version: user.version,
      preferences: user.preferences,
      createdAt: user.createdAt.toISOString(),
    });
    return { items: [profile], nextCursor: null };
  }
  async erase(
    input: { userId: string; requestId: string },
    tx: TxContext,
  ): Promise<UserDataErasure> {
    // TODO(verify): Q-32 phone lookup tombstone/re-registration policy; the
    // phone pair is retained until approved (users_live_phone_check permits
    // clearing it only on the final tombstone).
    await this.users.eraseProfile(tx, input.userId, this.clock.now());
    return { receipt: `users.profile:${input.requestId}`, status: 'completed' };
  }
}

/** Saved addresses (live rows, as the user sees them). */
@Injectable()
export class AddressDataOwner implements UserDataPort {
  readonly section = 'addresses' as const;
  constructor(
    @Inject(ADDRESS_REPOSITORY) private readonly addresses: AddressRepository,
    private readonly projection: AddressProjection,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}
  async exportPage(
    input: { userId: string; cursor: string | null; limit: number },
    tx: TxContext,
  ): Promise<UserDataExportPage> {
    const after = position(input.cursor);
    const rows = await this.addresses.list(
      tx,
      input.userId,
      input.limit,
      after && { createdAt: after.at, id: after.id },
    );
    const page = rows.slice(0, input.limit);
    const last = page.at(-1);
    return {
      items: page.map((row) => this.projection.present(row)),
      nextCursor:
        rows.length > input.limit && last
          ? `${last.createdAt}|${last.id}`
          : null,
    };
  }
  async erase(
    input: { userId: string; requestId: string },
    tx: TxContext,
  ): Promise<UserDataErasure> {
    // Text columns must stay sealed ciphertext; replace with a fixed marker.
    await this.addresses.eraseForUser(
      tx,
      input.userId,
      this.clock.now().toISOString(),
      (id) => this.projection.encrypt(input.userId, id, 'addressText', '-'),
    );
    return {
      receipt: `users.addresses:${input.requestId}`,
      status: 'completed',
    };
  }
}

/**
 * Consent evidence history. No erase: evidence retention is a Q-32 policy
 * decision (TODO(verify)), never silently deleted here.
 */
@Injectable()
export class ConsentDataOwner implements UserDataPort {
  readonly section = 'consents' as const;
  constructor(
    @Inject(CONSENT_REPOSITORY) private readonly consents: ConsentRepository,
  ) {}
  async exportPage(
    input: { userId: string; cursor: string | null; limit: number },
    tx: TxContext,
  ): Promise<UserDataExportPage> {
    const after = position(input.cursor);
    const rows = await this.consents.history(
      tx,
      input.userId,
      input.limit,
      after && { recordedAt: after.at, id: after.id },
    );
    const page = rows.slice(0, input.limit);
    const last = page.at(-1);
    return {
      items: page.map((row) =>
        ConsentRecordSchema.parse({
          consentId: row.id,
          purpose: row.purpose,
          channel: row.channel,
          granted: row.granted,
          noticeVersion: row.noticeVersion,
          recordedAt: row.recordedAt,
        }),
      ),
      nextCursor:
        rows.length > input.limit && last
          ? `${last.recordedAt}|${last.id}`
          : null,
    };
  }
}
