import { Prisma } from '../../../shared/persistence/generated/client';
/** Individual service rows, SERVICE taxonomy; never provider expertise joins. */
export const servicePublicProjection = Prisma.sql`SELECT * FROM services_public_discovery`;
