import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import {
  CreateAddressSchema,
  UpdateAddressSchema,
  DeleteAddressSchema,
  AddressListQuerySchema,
  AddressParamsSchema,
} from '@apnatown/shared/users';

test('Address DTOs reject mass assignment, malicious text, malformed IDs/versions and coordinate halves', () => {
  const input = CreateAddressSchema.parse({
    label: 'Synthetic',
    addressText: 'Synthetic address',
    pinCode: '000000',
    cityId: randomUUID(),
  });
  for (const patch of [
    { userId: randomUUID() },
    { id: randomUUID() },
    { deletedAt: null },
    { version: 2 },
    { roles: ['admin'] },
    { cityId: 'not-a-uuid' },
    { addressText: '<script>alert(1)</script>' },
    { label: 'x\u0000y' },
    { landmark: 'x'.repeat(201) },
    { addressText: 'x'.repeat(1001) },
    { pinCode: '12345' },
    { isDefault: 'true' },
    { lat: 0 },
    { lng: 0 },
    { lat: Infinity, lng: 0 },
    { lat: 91, lng: 0 },
    { lat: 0, lng: -181 },
  ])
    assert.equal(
      CreateAddressSchema.safeParse({ ...input, ...patch }).success,
      false,
    );
  for (const expectedVersion of [0, -1, 1.2, 2147483648, '1'])
    assert.equal(
      DeleteAddressSchema.safeParse({ expectedVersion }).success,
      false,
    );
  assert.equal(
    UpdateAddressSchema.safeParse({ expectedVersion: 1 }).success,
    false,
  );
  assert.equal(
    UpdateAddressSchema.safeParse({ expectedVersion: 1, lat: null }).success,
    false,
  );
  assert.equal(
    UpdateAddressSchema.safeParse({ expectedVersion: 1, lat: 1, lng: null })
      .success,
    false,
  );
  assert.equal(
    UpdateAddressSchema.safeParse({ expectedVersion: 1, lat: null, lng: null })
      .success,
    true,
  );
  assert.equal(
    AddressParamsSchema.safeParse({ addressId: "' OR true --" }).success,
    false,
  );
  assert.equal(CreateAddressSchema.parse({ ...input, lat: 0, lng: 0 }).lat, 0);
  assert.equal(AddressListQuerySchema.parse({}).limit, 20);
  assert.equal(AddressListQuerySchema.parse({ limit: '50' }).limit, 50);
  for (const query of [
    { userId: randomUUID() },
    { limit: '51' },
    { limit: ['1'] },
    { sort: 'id;DROP TABLE addresses' },
  ])
    assert.equal(AddressListQuerySchema.safeParse(query).success, false);
});
