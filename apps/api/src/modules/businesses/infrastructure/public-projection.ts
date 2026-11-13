import { Prisma } from '../../../shared/persistence/generated/client';
/** Businesses owns PRODUCT taxonomy memberships, public contacts and hours. */
export const businessPublicProjection = Prisma.sql`SELECT * FROM businesses_public_discovery`;
