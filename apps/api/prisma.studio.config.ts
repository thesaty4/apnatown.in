import { defineConfig } from 'prisma/config';

// Used only by `pnpm db:studio`; prisma/studio.mjs supplies a validated,
// read-only local URL. Migrations keep using prisma.config.ts.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: process.env.STUDIO_DATABASE_URL
    ? { url: process.env.STUDIO_DATABASE_URL }
    : {},
});
