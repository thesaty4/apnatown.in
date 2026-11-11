import { Pool } from 'pg';
import type { RuntimeConfig } from '../config/config';
import type { ReadinessRepository } from '../health/readiness';

export class PostgresReadinessRepository implements ReadinessRepository {
  private readonly pool: Pool;

  constructor(config: RuntimeConfig) {
    this.pool = new Pool({
      connectionString: config.DATABASE_URL,
      max: 2,
      connectionTimeoutMillis: 1000,
      statement_timeout: 1000,
      query_timeout: 1500,
      application_name: 'apnatown-probes',
    });
    // An idle client error must not kill liveness or leak its connection string.
    this.pool.on('error', () => {});
  }

  async check(): Promise<boolean> {
    const result = await this.pool.query<{
      extname: string;
      extversion: string;
    }>(
      'SELECT extname, extversion FROM pg_extension WHERE extname = ANY($1::text[])',
      [['postgis', 'pg_trgm', 'unaccent']],
    );
    const extensions = new Map(
      result.rows.map((row) => [row.extname, row.extversion]),
    );
    if (
      !extensions.get('postgis')?.startsWith('3.5.') ||
      !extensions.has('pg_trgm') ||
      !extensions.has('unaccent')
    )
      return false;

    // C01/C02 must supply reviewed migration checksums, exact extension/queue
    // versions and registered consumers. Connectivity or an arbitrary existing
    // schema is NOT readiness. Do not enable this gate by checking SELECT 1.
    return false;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
