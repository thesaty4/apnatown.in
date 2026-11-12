import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import type { JsonValue } from '@apnatown/shared';
import type {
  AddressPage,
  CreateAddress,
  UpdateAddress,
  DeleteAddress,
} from '@apnatown/shared/users';
import {
  IdSchema,
  TimestampSchema,
  type PageQuery,
} from '@apnatown/shared/wire';
import type { SessionBinding } from '../../../shared/auth';
import { DomainError } from '../../../shared/errors/errors';
import {
  CURSOR_CODEC,
  CursorCodec,
  type CursorBinding,
} from '../../../shared/pagination/cursor';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
  type TxContext,
} from '../../../shared/persistence/ports';
import {
  CLOCK,
  ID_PROVIDER,
  type Clock,
  type IdProvider,
} from '../../../shared/runtime/providers';
import {
  GEO_SCOPE,
  type GeoScopePort,
} from '../../geo/application/geo-scope.port';
import {
  ADDRESS_REPOSITORY,
  type AddressRepository,
  type StoredAddress,
} from '../domain/address';
import { AddressAccess } from './address-access';
import { AddressProjection } from './address-projection';
import type { UsersAddressPort } from './address-port';
import { AddressCommands, type AddressCommand } from './address-command';

const positionSchema = z.tuple([TimestampSchema, IdSchema]);

@Injectable()
export class AddressService implements UsersAddressPort {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    private readonly commands: AddressCommands,
    @Inject(ADDRESS_REPOSITORY) private readonly addresses: AddressRepository,
    @Inject(GEO_SCOPE) private readonly geo: GeoScopePort,
    private readonly access: AddressAccess,
    private readonly projection: AddressProjection,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
  ) {}
  list(session: SessionBinding, query: PageQuery): Promise<AddressPage> {
    return this.uow.run(async (tx) => {
      const userId = await this.access.own(tx, session);
      const binding: CursorBinding = {
        operation: 'users.addresses',
        sort: 'createdAt-id-desc',
        filters: {},
        scope: { userId },
      };
      const parsed = query.cursor
        ? positionSchema.safeParse(this.cursors.decode(query.cursor, binding))
        : undefined;
      if (parsed && !parsed.success) throw new DomainError('VALIDATION_ERROR');
      const after = parsed?.success
        ? { createdAt: parsed.data[0], id: parsed.data[1] }
        : undefined;
      const rows = await this.addresses.list(tx, userId, query.limit, after);
      const items = rows
        .slice(0, query.limit)
        .map((row) => this.projection.present(row));
      const last = rows.slice(0, query.limit).at(-1);
      return {
        items,
        nextCursor:
          rows.length > query.limit && last
            ? this.cursors.encode(binding, [last.createdAt, last.id])
            : null,
      };
    });
  }
  create(command: AddressCommand, input: CreateAddress) {
    return this.commands.run(
      command,
      'POST',
      null,
      input,
      async (tx, userId) => {
        await this.validateGeo(tx, input.cityId, input.areaId);
        const id = this.ids.uuidv7();
        const now = this.clock.now().toISOString();
        const row: StoredAddress = {
          id,
          userId,
          label: input.label,
          addressText: this.projection.encrypt(
            userId,
            id,
            'addressText',
            input.addressText,
          ),
          landmark:
            input.landmark === null
              ? null
              : this.projection.encrypt(userId, id, 'landmark', input.landmark),
          pinCode: input.pinCode,
          cityId: input.cityId,
          areaId: input.areaId,
          lat: input.lat,
          lng: input.lng,
          isDefault: input.isDefault,
          version: 1,
          deletedAt: null,
          createdAt: now,
          updatedAt: now,
        };
        if (row.isDefault) await this.demoteDefault(tx, userId, id, now);
        await this.addresses.insert(tx, row);
        return this.projection.present(row);
      },
    );
  }
  update(command: AddressCommand, id: string, input: UpdateAddress) {
    return this.commands.run(
      command,
      'PATCH',
      id,
      this.patchPayload(input),
      async (tx, userId) => {
        const row = await this.access.address(tx, userId, id);
        this.expectVersion(row, input.expectedVersion);
        const next = this.patch(row, input);
        await this.validateGeo(tx, next.cityId, next.areaId);
        if (next.isDefault)
          await this.demoteDefault(tx, userId, id, next.updatedAt);
        await this.save(tx, next, row.version);
        return this.projection.present(next);
      },
    );
  }
  delete(command: AddressCommand, id: string, input: DeleteAddress) {
    return this.commands.run(
      command,
      'DELETE',
      id,
      input,
      async (tx, userId) => {
        const row = await this.access.address(tx, userId, id);
        this.expectVersion(row, input.expectedVersion);
        const now = this.clock.now().toISOString();
        const next = {
          ...row,
          version: this.increment(row.version),
          isDefault: false,
          deletedAt: now,
          updatedAt: now,
        };
        await this.save(tx, next, row.version);
        // Deliberately no default successor.
        return { id, version: next.version, deleted: true };
      },
    );
  }
  forCheckout(
    input: { userId: string; addressId: string; expectedVersion?: number },
    tx?: TxContext,
  ) {
    const read = async (transaction: TxContext) => {
      await this.access.lockUser(transaction, input.userId);
      const row = await this.access.address(
        transaction,
        input.userId,
        input.addressId,
      );
      if (input.expectedVersion !== undefined)
        this.expectVersion(row, input.expectedVersion);
      const address = this.projection.present(row);
      return {
        id: address.id,
        version: address.version,
        cityId: address.cityId,
        areaId: address.areaId,
        location:
          address.lat === null || address.lng === null
            ? null
            : { lat: address.lat, lng: address.lng },
        addressText: address.addressText,
        landmark: address.landmark,
        pinCode: address.pinCode,
      };
    };
    return tx ? read(tx) : this.uow.run(read);
  }
  private patch(row: StoredAddress, input: UpdateAddress): StoredAddress {
    return {
      ...row,
      label: input.label ?? row.label,
      addressText:
        input.addressText === undefined
          ? row.addressText
          : this.projection.encrypt(
              row.userId,
              row.id,
              'addressText',
              input.addressText,
            ),
      landmark:
        input.landmark === undefined
          ? row.landmark
          : input.landmark === null
            ? null
            : this.projection.encrypt(
                row.userId,
                row.id,
                'landmark',
                input.landmark,
              ),
      pinCode: input.pinCode ?? row.pinCode,
      cityId: input.cityId ?? row.cityId,
      areaId: input.areaId === undefined ? row.areaId : input.areaId,
      lat: input.lat === undefined ? row.lat : input.lat,
      lng: input.lng === undefined ? row.lng : input.lng,
      isDefault: input.isDefault ?? row.isDefault,
      version: this.increment(row.version),
      updatedAt: this.clock.now().toISOString(),
    };
  }
  private patchPayload(input: UpdateAddress): JsonValue {
    const payload: { [key: string]: JsonValue } = {
      expectedVersion: input.expectedVersion,
    };
    for (const field of [
      'label',
      'addressText',
      'landmark',
      'pinCode',
      'cityId',
      'areaId',
      'lat',
      'lng',
      'isDefault',
    ] as const) {
      const value = input[field];
      if (value !== undefined) payload[field] = value;
    }
    return payload;
  }
  private async validateGeo(
    tx: TxContext,
    cityId: string,
    areaId: string | null,
  ) {
    try {
      await this.geo.assertAreasInCity(
        { cityId, areaIds: areaId === null ? [] : [areaId] },
        tx,
      );
    } catch (error) {
      if (
        error instanceof DomainError &&
        ['CITY_NOT_FOUND', 'AREA_NOT_FOUND'].includes(error.code)
      )
        throw new DomainError('ADDRESS_OUT_OF_SCOPE');
      throw error;
    }
  }
  private async demoteDefault(
    tx: TxContext,
    userId: string,
    exceptId: string,
    now: string,
  ) {
    const previous = await this.addresses.defaultAddress(tx, userId);
    if (previous && previous.id !== exceptId)
      await this.save(
        tx,
        {
          ...previous,
          isDefault: false,
          version: this.increment(previous.version),
          updatedAt: now,
        },
        previous.version,
      );
  }
  private async save(
    tx: TxContext,
    row: StoredAddress,
    expectedVersion: number,
  ) {
    if (!(await this.addresses.update(tx, row, expectedVersion)))
      throw new DomainError('ADDRESS_VERSION_CONFLICT');
  }
  private expectVersion(row: StoredAddress, expected: number) {
    if (row.version !== expected)
      throw new DomainError('ADDRESS_VERSION_CONFLICT');
  }
  private increment(version: number): number {
    if (version >= 2147483647)
      throw new DomainError('ADDRESS_VERSION_CONFLICT');
    return version + 1;
  }
}
