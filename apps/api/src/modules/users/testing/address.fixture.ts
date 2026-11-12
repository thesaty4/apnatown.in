import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import type { JsonValue } from '@apnatown/shared';
import { CreateAddressSchema } from '@apnatown/shared/users';
import type { Principal } from '@apnatown/shared/auth';
import type { SessionAccess } from '../../../shared/auth';
import { NodeIdentityCrypto } from '../../../shared/auth/crypto';
import { DomainError } from '../../../shared/errors/errors';
import { HttpCommandContextFactory } from '../../../shared/idempotency/context';
import { CursorCodec } from '../../../shared/pagination/cursor';
import type {
  CommandContext,
  CommandUnitOfWork,
  TxContext,
  UnitOfWork,
} from '../../../shared/persistence/ports';
import { SystemIdProvider } from '../../../shared/runtime/providers';
import { GeoScopeService } from '../../geo/application/geo-scope.service';
import type { AddressRepository, StoredAddress } from '../domain/address';
import type { UsersRepository, UserIdentity } from '../domain/identity';
import { AddressAccess } from '../application/address-access';
import {
  AddressCommands,
  type AddressCommand,
} from '../application/address-command';
import { AddressProjection } from '../application/address-projection';
import { AddressService } from '../application/address.service';

export const hasCode = (code: string) => (error: unknown) =>
  error instanceof DomainError && error.code === code;

/** Isolated port fakes only: no database, seeded accounts, provider or network. */
export function addressFixture() {
  const tx = Object.freeze({}) as TxContext;
  const userId = randomUUID();
  const cityId = randomUUID();
  const areaId = randomUUID();
  const session = {
    id: randomUUID(),
    csrfToken: randomBytes(128).toString('hex'),
  };
  const clock = { now: () => new Date('2026-11-12T00:00:00.123Z') };
  const principal: Principal = {
    userId,
    roles: ['customer'],
    accountStatus: 'active',
    approvalStates: { businesses: 'unavailable', rider: 'unavailable' },
  };
  const state = {
    rows: new Map<string, StoredAddress>(),
    live: true,
    active: true,
    geoValid: true,
    failInsert: false,
    principal,
    userLocks: 0,
    sessionChecks: 0,
    receipts: new Map<string, { hash: string; body: JsonValue }>(),
    command: undefined as CommandContext | undefined,
  };
  let queue = Promise.resolve();
  const uow: UnitOfWork = {
    run(work) {
      const pending = queue.then(async () => {
        const before = structuredClone(state.rows);
        try {
          return await work(tx);
        } catch (error) {
          state.rows = before;
          throw error;
        }
      });
      queue = pending.then(
        () => undefined,
        () => undefined,
      );
      return pending;
    },
  };
  const commands: CommandUnitOfWork = {
    run(command, work, policy) {
      return uow.run(async (transaction) => {
        state.command = command;
        const key = `${command.actor.id}:${command.operation}:${Buffer.from(command.keyHash).toString('hex')}`;
        const hash = Buffer.from(command.requestHash).toString('hex');
        const prior = state.receipts.get(key);
        if (prior) {
          if (prior.hash !== hash) throw new DomainError('COMMON_CONFLICT');
          return policy.replay(transaction, prior.body, command);
        }
        const result = await work(transaction);
        state.receipts.set(key, { hash, body: policy.store(result) });
        return result;
      });
    },
  };
  const sessions: SessionAccess = {
    async requirePrincipal(transaction, binding) {
      assert.equal(transaction, tx);
      state.sessionChecks++;
      if (!state.live || binding.id !== session.id)
        throw new DomainError('SESSION_EXPIRED');
      if (binding.csrfToken !== session.csrfToken)
        throw new DomainError('CSRF_INVALID');
      return state.principal;
    },
  };
  const users = {
    async lock(transaction: TxContext, id: string) {
      assert.equal(transaction, tx);
      assert.equal(id, state.principal.userId);
      state.userLocks++;
      return {
        id,
        accountStatus: state.active ? 'active' : 'suspended',
        deletedAt: null,
      } as UserIdentity;
    },
  } as UsersRepository;
  const repository: AddressRepository = {
    async list(transaction, owner, limit, after) {
      assert.equal(transaction, tx);
      return [...state.rows.values()]
        .filter(
          (row) =>
            row.userId === owner &&
            !row.deletedAt &&
            (!after ||
              row.createdAt < after.createdAt ||
              (row.createdAt === after.createdAt && row.id < after.id)),
        )
        .sort(
          (a, b) =>
            b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
        )
        .slice(0, limit + 1);
    },
    async lock(transaction, id) {
      assert.equal(transaction, tx);
      return state.rows.get(id) ?? null;
    },
    async defaultAddress(transaction, owner) {
      assert.equal(transaction, tx);
      return (
        [...state.rows.values()].find(
          (row) => row.userId === owner && !row.deletedAt && row.isDefault,
        ) ?? null
      );
    },
    async insert(transaction, row) {
      assert.equal(transaction, tx);
      if (state.failInsert) throw new Error('SIMULATED_INSERT_FAILURE');
      state.rows.set(row.id, row);
    },
    async update(transaction, row, expected) {
      assert.equal(transaction, tx);
      const prior = state.rows.get(row.id);
      if (
        !prior ||
        prior.userId !== row.userId ||
        prior.deletedAt ||
        prior.version !== expected
      )
        return false;
      state.rows.set(row.id, row);
      return true;
    },
  };
  const geo = new GeoScopeService(uow, {
    async lockCity(transaction, id) {
      assert.equal(transaction, tx);
      return state.geoValid && id === cityId;
    },
    async lockAreas(transaction, id, ids) {
      assert.equal(transaction, tx);
      return id === cityId ? ids.filter((value) => value === areaId) : [];
    },
  });
  const crypto = new NodeIdentityCrypto(
    randomBytes(32).toString('hex'),
    randomBytes(32).toString('hex'),
  );
  const access = new AddressAccess(sessions, users, repository);
  const projection = new AddressProjection(crypto);
  const runner = new AddressCommands(
    commands,
    new HttpCommandContextFactory(randomBytes(32).toString('hex')),
    access,
    projection,
    clock,
  );
  const service = new AddressService(
    uow,
    runner,
    repository,
    geo,
    access,
    projection,
    new CursorCodec(randomBytes(32).toString('base64url')),
    clock,
    new SystemIdProvider(clock),
  );
  const command = (key = randomUUID()): AddressCommand => ({
    key,
    actorId: state.principal.userId,
    session,
    correlationId: 'address-test',
  });
  const input = CreateAddressSchema.parse({
    label: 'Synthetic',
    addressText: 'Synthetic address',
    landmark: 'Synthetic marker',
    pinCode: '000000',
    cityId,
    areaId,
  });
  return {
    state,
    service,
    command,
    input,
    userId,
    cityId,
    areaId,
    session,
    tx,
    geo,
    projection,
  };
}
