import { FIXTURE_CLOCK, fixtureId } from './seed-fixtures.mjs';
import { findSeedUser } from './seed-context.mjs';

// Prototype role-matrix letters (js18.js RACT_L).
const ACTIONS = { v: 'view', c: 'create', e: 'edit', d: 'delete', x: 'export' };
// Sample audit actor label; the pack has no Super Admin person record.
const SUPER_ADMIN_NAME = 'Super Admin';

function invalid() {
  throw new Error('SEED_DATA_INVALID');
}

function samplePhones(value, phones = new Set()) {
  if (Array.isArray(value)) value.forEach((item) => samplePhones(item, phones));
  else if (value && typeof value === 'object')
    for (const [key, item] of Object.entries(value)) {
      if (['phone', 'wa'].includes(key) && typeof item === 'string')
        phones.add(item);
      else samplePhones(item, phones);
    }
  return phones;
}

// Sample rider vehicle text, e.g. "Bike UP57 AB 2210" -> bike + number.
const VEHICLE = /^(Bike|Scooter|Cycle)\s+([A-Z0-9][A-Z0-9 -]{3,19})$/;

function riderFixture(sample, helpers, fixtures, phone) {
  const rider = (sample.riders ?? []).find(
    (entry) => entry.phone && helpers.normalizePhone(entry.phone) === phone,
  );
  const vehicle = VEHICLE.exec(rider?.vehicle ?? '');
  const area = fixtures.areas.find((entry) => entry.en === rider?.area);
  if (!rider || rider.status !== 'approved' || !vehicle || !area) invalid();
  return {
    user: {
      id: fixtureId('user', rider.id),
      phone,
      name: rider.name,
      roles: ['customer', 'rider'],
    },
    profile: {
      fullName: rider.name,
      vehicleType: vehicle[1].toLowerCase(),
      vehicleNumber: vehicle[2],
      areaKey: area.key,
    },
  };
}

function matrix(role, helpers) {
  const permissions = {};
  for (const [module, letters] of Object.entries(role.mx ?? {})) {
    if (typeof letters !== 'string') invalid();
    permissions[module] = [...letters].map((letter) => ACTIONS[letter]);
  }
  return helpers.permissionInputSchema.parse(permissions);
}

/**
 * Local/test-only Demo controls identities (docs/adr/0002) for the API's
 * shared DEMO_PERSONAS map. Vendor/provider personas are fixture owners;
 * customer, rider, admin and super admin are seeded here with their roles
 * (the rider also gets its approved Delivery rider profile).
 */
export function buildPersonaFixtures(sample, helpers, fixtures) {
  const personas = helpers.demoPersonas;
  const phone = (key) => helpers.normalizePhone(personas[key].phone);
  const byPhone = (list, key) =>
    (list ?? []).find(
      (entry) =>
        entry.phone && helpers.normalizePhone(entry.phone) === phone(key),
    );
  const customer = byPhone(sample.users, 'customer');
  const admin = byPhone(sample.admins, 'admin');
  const role = sample.roles?.find((entry) => entry.name === admin?.role);
  const areaKeys = new Set(fixtures.areas.map((area) => area.key));
  const rider = riderFixture(sample, helpers, fixtures, phone('rider'));
  const known = new Set([...samplePhones(sample)].map(helpers.normalizePhone));
  if (
    !customer ||
    admin?.status !== 'active' ||
    !role ||
    !admin.areas?.length ||
    admin.areas.some((key) => !areaKeys.has(key)) ||
    known.has(phone('super_admin')) ||
    new Set(Object.keys(personas).map(phone)).size !==
      Object.keys(personas).length ||
    ['vendor', 'provider'].some(
      (key) =>
        !fixtures.owners.some(
          (owner) =>
            owner.phone === phone(key) && owner.role === personas[key].role,
        ),
    )
  )
    invalid();
  return {
    users: [
      {
        id: fixtureId('user', customer.id),
        phone: phone('customer'),
        name: customer.name,
        roles: ['customer'],
      },
      {
        id: fixtureId('user', admin.id),
        phone: phone('admin'),
        name: admin.name,
        roles: ['customer', 'admin'],
      },
      {
        id: fixtureId('user', 'super-admin'),
        phone: phone('super_admin'),
        name: SUPER_ADMIN_NAME,
        roles: ['customer', 'super_admin'],
      },
      // Appended last: seed-context reads users[0..2] by position.
      rider.user,
    ],
    rider: rider.profile,
    role: {
      id: fixtureId('admin-role', role.id),
      name: role.name,
      description: role.desc ?? null,
      system: role.system === true,
      permissions: matrix(role, helpers),
    },
    admin: {
      key: admin.id,
      phone: phone('admin'),
      name: admin.name,
      email: admin.email,
      areas: admin.areas,
      communicationScopes: (admin.scopes ?? []).map((scope) =>
        helpers.communicationScopeSchema.parse(scope),
      ),
      permissions: helpers.permissionInputSchema.parse(admin.perms ?? {}),
    },
  };
}

function grants(permissions) {
  return Object.entries(permissions).flatMap(([module, actions]) =>
    actions.map((action) => [module, action]),
  );
}

async function insertGrants(client, table, column, id, permissions) {
  for (const [module, action] of grants(permissions))
    await client.query(
      `INSERT INTO ${table} (${column}, module, action)
       VALUES ($1::uuid, $2, $3) ON CONFLICT DO NOTHING`,
      [id, module, action],
    );
}

// Reuses an account that already signed in with the persona phone.
async function seedUser(client, crypto, user, counts) {
  const hash = Buffer.from(crypto.phoneHash(user.phone));
  let id = await findSeedUser(client, crypto, user);
  if (!id) {
    await client.query(
      `INSERT INTO users (id, phone_ciphertext, phone_lookup_hash, display_name,
         created_at, updated_at)
       VALUES ($1::uuid, $2, $3, $4, $5, $5)`,
      [
        user.id,
        crypto.encrypt(user.phone, `user:${user.id}:phone`),
        hash,
        user.name,
        FIXTURE_CLOCK,
      ],
    );
    id = user.id;
    counts.personas += 1;
  }
  return id;
}

async function grantRoles(client, id, roles) {
  await client.query(
    `INSERT INTO user_roles (user_id, role, created_at)
     SELECT $1::uuid, role, $3::timestamptz FROM unnest($2::text[]) AS role
     ON CONFLICT DO NOTHING`,
    [id, roles, FIXTURE_CLOCK],
  );
}

async function seedRole(client, role) {
  const { rowCount } = await client.query(
    `INSERT INTO roles (id, name, description, is_system, created_at, updated_at)
     VALUES ($1::uuid, $2, $3, $4, $5, $5) ON CONFLICT DO NOTHING`,
    [role.id, role.name, role.description, role.system, FIXTURE_CLOCK],
  );
  // An existing same-named role keeps its operator-edited permissions.
  if (rowCount === 1)
    await insertGrants(
      client,
      'role_permissions',
      'role_id',
      role.id,
      role.permissions,
    );
  const { rows } = await client.query('SELECT id FROM roles WHERE name = $1', [
    role.name,
  ]);
  if (!rows.length) invalid();
  return rows[0].id;
}

async function exclusive(client, id, role) {
  // Admin accounts and super_admin never share a user (Admin create rule).
  const { rowCount } = await client.query(
    role === 'admin'
      ? `SELECT 1 FROM user_roles WHERE user_id = $1::uuid AND role = 'super_admin'`
      : 'SELECT 1 FROM admin_accounts WHERE user_id = $1::uuid',
    [id],
  );
  return rowCount === 0;
}

async function seedAdmin(client, helpers, admin, ids) {
  const { rowCount } = await client.query(
    `INSERT INTO admin_accounts (user_id, display_name, email_ciphertext, role_id,
       status, communication_scopes, created_at, updated_at)
     VALUES ($1::uuid, $2, $3, $4::uuid, 'active', $5::text[], $6, $6)
     ON CONFLICT DO NOTHING`,
    [
      ids.userId,
      admin.name,
      helpers.crypto.encrypt(
        admin.email,
        helpers.adminEmailContext(ids.userId),
      ),
      ids.roleId,
      admin.communicationScopes,
      FIXTURE_CLOCK,
    ],
  );
  if (rowCount !== 1) return 0;
  await insertGrants(
    client,
    'admin_permissions',
    'user_id',
    ids.userId,
    admin.permissions,
  );
  for (const key of admin.areas)
    await client.query(
      `INSERT INTO admin_scopes (id, user_id, authority, area_id, city_id)
       VALUES ($1::uuid, $2::uuid, 'area', $3::uuid, $4::uuid) ON CONFLICT DO NOTHING`,
      [
        fixtureId('admin-scope', `${admin.key}:${key}`),
        ids.userId,
        ids.areaIds.get(key),
        ids.cityId,
      ],
    );
  return 1;
}

// Approved demo rider (sample status approved, offline). The sample pack has
// no payout instrument, so payout stays empty rather than invented.
async function seedRiderProfile(client, userId, rider, scope) {
  const areaId = scope.areaIds.get(rider.areaKey);
  if (!areaId) invalid();
  const { rowCount } = await client.query(
    `INSERT INTO rider_profiles (user_id, city_id, area_id, full_name,
       vehicle_type, vehicle_number, status, submitted_at, is_online,
       preferred_locale, version, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, 'approved', $7, FALSE,
       'en', 1, $7, $7)
     ON CONFLICT DO NOTHING`,
    [
      userId,
      scope.cityId,
      areaId,
      rider.fullName,
      rider.vehicleType,
      rider.vehicleNumber,
      FIXTURE_CLOCK,
    ],
  );
  return rowCount;
}

/** Insert-only persona rows; existing users, roles and admin accounts stay untouched. */
export async function seedPersonas(client, helpers, personas, scope, counts) {
  const [customer, admin, superAdmin, rider] = personas.users;
  if (personas.admin.areas.some((key) => !scope.areaIds.has(key))) invalid();
  await grantRoles(
    client,
    await seedUser(client, helpers.crypto, customer, counts),
    customer.roles,
  );
  const adminId = await seedUser(client, helpers.crypto, admin, counts);
  if (await exclusive(client, adminId, 'admin')) {
    const roleId = await seedRole(client, personas.role);
    await grantRoles(client, adminId, admin.roles);
    counts.adminAccounts += await seedAdmin(client, helpers, personas.admin, {
      ...scope,
      userId: adminId,
      roleId,
    });
  } else counts.personaConflicts += 1;
  const superId = await seedUser(client, helpers.crypto, superAdmin, counts);
  if (await exclusive(client, superId, 'super_admin'))
    await grantRoles(client, superId, superAdmin.roles);
  else counts.personaConflicts += 1;
  const riderId = await seedUser(client, helpers.crypto, rider, counts);
  await grantRoles(client, riderId, rider.roles);
  counts.riders += await seedRiderProfile(
    client,
    riderId,
    personas.rider,
    scope,
  );
}
