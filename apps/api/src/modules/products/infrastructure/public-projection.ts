import { Prisma } from '../../../shared/persistence/generated/client';
/** Products owns visibility, inventory, effective offer pricing and Premium. */
export const productPublicProjection = Prisma.sql`SELECT * FROM products_public_discovery`;
