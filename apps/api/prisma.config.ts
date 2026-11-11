import { defineConfig } from 'prisma/config';

// Generation is offline. Privileged URLs are supplied only by the DB launcher.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'node prisma/cli.mjs seed' },
  datasource: {
    ...(process.env.MIGRATION_DATABASE_URL
      ? { url: process.env.MIGRATION_DATABASE_URL }
      : {}),
    ...(process.env.SHADOW_DATABASE_URL
      ? { shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL }
      : {}),
  },
});
