import type {
  AdminListingProductPage,
  AdminProductPublication,
  AdminProductPublicationResult,
} from '@apnatown/shared/admin';
import type { SessionBinding } from '../../../shared/auth';
import type { AdminReadContext } from '../../../shared/auth/ports';

/**
 * Products-owned admin port (F-AD-003), called only by Admin Listings after
 * `catalog:view`/`catalog:edit`; the business area scope is rechecked here.
 */
export const PRODUCT_ADMIN = Symbol('PRODUCT_ADMIN');
export interface ProductAdminCommand {
  session: SessionBinding;
  actorId: string;
  correlationId: string;
  key: unknown;
}
export interface ProductAdminPort {
  /** Non-deleted products, including unpublished ones, newest first. */
  listForBusiness(
    ctx: AdminReadContext,
    input: { businessId: string; cursor?: string; limit: number },
  ): Promise<AdminListingProductPage>;
  /** Versioned publish/unpublish with audit and outbox (owner notified). */
  setPublishedByAdmin(
    command: ProductAdminCommand,
    input: { productId: string } & AdminProductPublication,
  ): Promise<AdminProductPublicationResult>;
}
