import pg from 'pg';

export async function withDatabase(url, work) {
  const client = new pg.Client({
    connectionString: url.toString(),
    connectionTimeoutMillis: 2000,
    statement_timeout: 5000,
    query_timeout: 6000,
    application_name: 'apnatown-db-cli',
  });
  client.on('error', () => {});
  try {
    await client.connect();
    return await work(client);
  } finally {
    await client.end();
  }
}

// PostgreSQL DDL cannot bind identifiers/password literals. Its own format()
// quotes bound values with %I/%L; never interpolate CLI strings into SQL.
export async function ddl(client, template, values) {
  const { rows } = await client.query(template, values);
  if (typeof rows[0]?.statement !== 'string') throw new Error('INVALID_DDL');
  await client.query(rows[0].statement);
}

export async function databaseMarker(client, name) {
  const { rows } = await client.query(
    "SELECT shobj_description(oid, 'pg_database') AS marker FROM pg_database WHERE datname = $1",
    [name],
  );
  return rows.length ? rows[0].marker : undefined;
}

export async function createDatabase(client, name, marker) {
  await ddl(
    client,
    "SELECT format('CREATE DATABASE %I OWNER apnatown_migrator', $1::text) AS statement",
    [name],
  );
  await ddl(
    client,
    "SELECT format('COMMENT ON DATABASE %I IS %L', $1::text, $2::text) AS statement",
    [name, marker],
  );
}

export async function restrictDatabase(
  url,
  databaseName,
  runtimeAccess = true,
) {
  await withDatabase(url, async (client) => {
    await ddl(
      client,
      "SELECT format('REVOKE ALL ON DATABASE %I FROM PUBLIC', $1::text) AS statement",
      [databaseName],
    );
    await client.query('REVOKE CREATE ON SCHEMA public FROM PUBLIC');
    if (runtimeAccess) {
      await ddl(
        client,
        "SELECT format('GRANT CONNECT ON DATABASE %I TO apnatown_runtime', $1::text) AS statement",
        [databaseName],
      );
      await client.query('GRANT USAGE ON SCHEMA public TO apnatown_runtime');
    }
    // C01/C02 grant per-table permissions, including Audit SELECT/INSERT only.
    // Blanket future-table grants here would silently grant Audit UPDATE/DELETE.
  });
}
