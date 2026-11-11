import {
  createDatabase,
  databaseMarker,
  ddl,
  restrictDatabase,
  withDatabase,
} from './database.mjs';
import { localTargets } from './targets.mjs';

export async function provision(env) {
  const targets = localTargets(env);
  await withDatabase(targets.migration, async (client) => {
    // Serialize repeated explicit provision commands. Never invoked by API startup.
    await client.query(
      "SELECT pg_advisory_lock(hashtext('apnatown:c00:provision'))",
    );
    const { rows } = await client.query(
      'SELECT rolname FROM pg_roles WHERE rolname = $1',
      ['apnatown_runtime'],
    );
    if (!rows.length) await client.query('CREATE ROLE apnatown_runtime');
    await ddl(
      client,
      "SELECT format('ALTER ROLE apnatown_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD %L', $1::text) AS statement",
      [decodeURIComponent(targets.runtime.password)],
    );
    const memberships = await client.query(
      'SELECT 1 FROM pg_auth_members WHERE member = (SELECT oid FROM pg_roles WHERE rolname = $1)',
      ['apnatown_runtime'],
    );
    if (memberships.rows.length) throw new Error('UNSAFE_RUNTIME_MEMBERSHIPS');
    const marker = await databaseMarker(client, 'apnatown_shadow');
    if (marker === undefined)
      await createDatabase(
        client,
        'apnatown_shadow',
        'apnatown:c00:local:shadow',
      );
    else if (marker !== 'apnatown:c00:local:shadow')
      throw new Error('UNMARKED_SHADOW_DATABASE');
  });
  await restrictDatabase(targets.migration, 'apnatown_local');
  await restrictDatabase(targets.shadow, 'apnatown_shadow', false);
}
