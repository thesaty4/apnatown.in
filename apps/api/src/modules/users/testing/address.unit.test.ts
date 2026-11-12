import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { AddressSchema } from '@apnatown/shared/users';
import { addressFixture, hasCode } from './address.fixture';

test('CRUD encrypts private fields, clears optional pairs, preserves ownership and replays the original result', async () => {
  const h = addressFixture();
  const command = h.command();
  const created = AddressSchema.parse(
    await h.service.create(command, { ...h.input, lat: 0, lng: 0 }),
  );
  const row = h.state.rows.get(created.id)!;
  assert.notEqual(row.addressText, h.input.addressText);
  assert.notEqual(row.landmark, h.input.landmark);
  const stored = JSON.stringify([...h.state.receipts.values()]);
  for (const text of [
    h.input.addressText,
    h.input.landmark!,
    h.input.pinCode,
    'csrfToken',
  ])
    assert.equal(stored.includes(text), false);
  assert.equal(h.state.command?.successStatus, 201);
  const updated = await h.service.update(h.command(), created.id, {
    expectedVersion: 1,
    label: 'Changed',
    landmark: null,
    lat: null,
    lng: null,
    areaId: null,
  });
  assert.equal(updated.version, 2);
  assert.deepEqual(
    await h.service.create(command, { ...h.input, lat: 0, lng: 0 }),
    created,
  );
  assert.equal(h.state.rows.size, 1);
  assert.equal(h.state.rows.get(created.id)?.version, 2);
  assert.equal(h.state.rows.get(created.id)?.userId, h.userId);
  const deletion = h.command();
  const deleted = await h.service.delete(deletion, created.id, {
    expectedVersion: 2,
  });
  assert.deepEqual(deleted, { id: created.id, version: 3, deleted: true });
  assert.deepEqual(
    await h.service.delete(deletion, created.id, { expectedVersion: 2 }),
    deleted,
  );
  assert.deepEqual(await h.service.list(h.session, { limit: 20 }), {
    items: [],
    nextCursor: null,
  });
  await assert.rejects(
    h.service.update(h.command(), created.id, {
      expectedVersion: 3,
      label: 'Changed',
    }),
    hasCode('ADDRESS_NOT_FOUND'),
  );
});

test('Replay reauthorizes expired sessions, suspended accounts, changed actors and ownership before decryption', async () => {
  const h = addressFixture();
  const command = h.command();
  const created = await h.service.create(command, h.input);
  h.state.live = false;
  await assert.rejects(
    h.service.create(command, h.input),
    hasCode('SESSION_EXPIRED'),
  );
  await assert.rejects(
    h.service.list(h.session, { limit: 20 }),
    hasCode('SESSION_EXPIRED'),
  );
  h.state.live = true;
  h.state.active = false;
  await assert.rejects(
    h.service.create(command, h.input),
    hasCode('ACCOUNT_UNAVAILABLE'),
  );
  h.state.active = true;
  h.state.principal = { ...h.state.principal, userId: randomUUID() };
  await assert.rejects(
    h.service.create(command, h.input),
    hasCode('COMMON_FORBIDDEN'),
  );
  h.state.principal = { ...h.state.principal, userId: h.userId };
  h.state.rows.get(created.id)!.userId = randomUUID();
  await assert.rejects(
    h.service.create(command, h.input),
    hasCode('ADDRESS_OUT_OF_SCOPE'),
  );
  await assert.rejects(
    h.service.update(h.command(), created.id, {
      expectedVersion: 1,
      label: 'Changed',
    }),
    hasCode('ADDRESS_OUT_OF_SCOPE'),
  );
  await assert.rejects(
    h.service.delete(h.command(), created.id, { expectedVersion: 1 }),
    hasCode('ADDRESS_OUT_OF_SCOPE'),
  );
  await assert.rejects(
    h.service.forCheckout({ userId: h.userId, addressId: created.id }),
    hasCode('ADDRESS_OUT_OF_SCOPE'),
  );
  assert.equal(
    (await h.service.list(h.session, { limit: 20 })).items.length,
    0,
  );
});

test('Same-key payload/resource conflicts do not execute another command; malformed keys fail closed', async () => {
  const h = addressFixture();
  const command = h.command();
  const created = await h.service.create(command, h.input);
  await assert.rejects(
    h.service.create(command, { ...h.input, label: 'Changed' }),
    hasCode('COMMON_CONFLICT'),
  );
  const edit = h.command();
  await h.service.update(edit, created.id, {
    expectedVersion: 1,
    label: 'Changed',
  });
  await assert.rejects(
    h.service.update(edit, randomUUID(), {
      expectedVersion: 1,
      label: 'Changed',
    }),
    hasCode('COMMON_CONFLICT'),
  );
  for (const key of [undefined, '', 'x,y', 'a b', ['a', 'a'], 'x'.repeat(129)])
    assert.throws(
      () => h.service.create({ ...h.command(), key }, h.input),
      hasCode('COMMON_VALIDATION_FAILED'),
    );
  assert.equal(h.state.rows.size, 1);
});

test('Defaults serialize and version every changed row; stale/overflow edits and failed inserts roll back', async () => {
  const h = addressFixture();
  const [first, second] = await Promise.all([
    h.service.create(h.command(), { ...h.input, isDefault: true }),
    h.service.create(h.command(), { ...h.input, isDefault: true }),
  ]);
  assert.equal(h.state.rows.get(first.id)?.version, 2);
  assert.equal(
    [...h.state.rows.values()].filter((row) => row.isDefault).length,
    1,
  );
  await assert.rejects(
    h.service.update(h.command(), first.id, {
      expectedVersion: 1,
      isDefault: true,
    }),
    hasCode('ADDRESS_VERSION_CONFLICT'),
  );
  await assert.rejects(
    h.service.forCheckout({
      userId: h.userId,
      addressId: first.id,
      expectedVersion: 1,
    }),
    hasCode('ADDRESS_VERSION_CONFLICT'),
  );
  const race = await Promise.allSettled([
    h.service.update(h.command(), first.id, {
      expectedVersion: 2,
      isDefault: true,
    }),
    h.service.update(h.command(), first.id, {
      expectedVersion: 2,
      label: 'Changed',
    }),
  ]);
  assert.equal(
    race.filter((outcome) => outcome.status === 'fulfilled').length,
    1,
  );
  assert.equal(h.state.rows.get(second.id)?.version, 2);
  h.state.failInsert = true;
  await assert.rejects(
    h.service.create(h.command(), { ...h.input, isDefault: true }),
    /SIMULATED_INSERT_FAILURE/,
  );
  assert.equal(h.state.rows.get(first.id)?.isDefault, true);
  assert.equal(h.state.rows.get(first.id)?.version, 3);
  h.state.rows.get(second.id)!.version = 2147483647;
  await assert.rejects(
    h.service.delete(h.command(), second.id, { expectedVersion: 2147483647 }),
    hasCode('ADDRESS_VERSION_CONFLICT'),
  );
  await h.service.delete(h.command(), first.id, { expectedVersion: 3 });
  assert.equal(
    [...h.state.rows.values()].some((row) => row.isDefault),
    false,
  );
  await assert.rejects(
    h.service.forCheckout({
      userId: h.userId,
      addressId: first.id,
      expectedVersion: 3,
    }),
    hasCode('ADDRESS_NOT_FOUND'),
  );
});

test('Geo uses authoritative city/area IDs, permits no location, and checks merged PATCH destinations', async () => {
  const h = addressFixture();
  for (const input of [
    { ...h.input, cityId: randomUUID() },
    { ...h.input, areaId: randomUUID() },
  ])
    await assert.rejects(
      h.service.create(h.command(), input),
      hasCode('ADDRESS_OUT_OF_SCOPE'),
    );
  const created = await h.service.create(h.command(), h.input);
  await assert.rejects(
    h.service.update(h.command(), created.id, {
      expectedVersion: 1,
      cityId: randomUUID(),
    }),
    hasCode('ADDRESS_OUT_OF_SCOPE'),
  );
  assert.equal(h.state.rows.get(created.id)?.version, 1);
  const cityOnly = AddressSchema.parse(
    await h.service.create(h.command(), { ...h.input, areaId: null }),
  );
  assert.equal(cityOnly.lat, null);
  const pinned = await h.service.forCheckout(
    { userId: h.userId, addressId: created.id, expectedVersion: 1 },
    h.tx,
  );
  assert.equal(pinned.location, null);
  h.state.geoValid = false;
  await assert.rejects(
    h.service.create(h.command(), { ...h.input, areaId: null }),
    hasCode('ADDRESS_OUT_OF_SCOPE'),
  );
});

test('Address pagination binds the owner, keeps microseconds/ties, rejects tampering and never leaks deleted rows', async () => {
  const h = addressFixture();
  const ids = await Promise.all([
    h.service.create(h.command(), h.input),
    h.service.create(h.command(), h.input),
  ]);
  for (const row of h.state.rows.values())
    row.createdAt = '2026-11-12T00:00:00.123456Z';
  const page = await h.service.list(h.session, { limit: 1 });
  assert.ok(page.nextCursor);
  const next = await h.service.list(h.session, {
    limit: 1,
    cursor: page.nextCursor,
  });
  assert.equal(next.nextCursor, null);
  assert.equal(
    new Set([page.items[0]?.id, next.items[0]?.id]).size,
    ids.length,
  );
  assert.equal(next.items[0]?.createdAt, '2026-11-12T00:00:00.123456Z');
  await assert.rejects(
    h.service.list(h.session, { limit: 1, cursor: `${page.nextCursor}x` }),
    hasCode('COMMON_VALIDATION_FAILED'),
  );
  h.state.principal = { ...h.state.principal, userId: randomUUID() };
  await assert.rejects(
    h.service.list(h.session, { limit: 1, cursor: page.nextCursor }),
    hasCode('COMMON_VALIDATION_FAILED'),
  );
});
