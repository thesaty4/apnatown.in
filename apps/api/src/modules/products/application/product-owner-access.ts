import { Inject, Injectable } from '@nestjs/common';
import type { BusinessKind } from '@apnatown/shared/businesses';
import type { SessionBinding } from '../../../shared/auth';
import { SESSION_ACCESS, type SessionAccess } from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';
import { BusinessOwnerContext } from '../../businesses/application/business-owner-context';
import type { StoredBusiness } from '../../businesses/domain/business';
import type { StoredProduct } from './product-owner-ports';

/** Authenticated vendor/provider; the business is resolved server-side. */
export interface ProductOwnerRequest {
  session: SessionBinding;
  actorId: string;
  businessKind?: BusinessKind;
}

/** Owner write: adds correlation and the optional Idempotency-Key header. */
export interface ProductOwnerCommand extends ProductOwnerRequest {
  correlationId: string;
  key?: unknown;
}

type Denial = 'USERS_APPROVAL_REQUIRED' | 'COMMON_FORBIDDEN';

/**
 * Resolves the caller's own APPROVED vendor/provider business with its live
 * seller role inside the caller's transaction (rule 1, BR-06). X-Business-Kind
 * only selects between the caller's own businesses; a body owner ID is never
 * accepted. `lock` row-locks the business so a concurrent suspension cannot
 * interleave with a write.
 */
@Injectable()
export class ProductOwnerAccess {
  constructor(
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    private readonly owners: BusinessOwnerContext,
  ) {}

  async resolve(
    tx: TxContext,
    request: ProductOwnerRequest,
    options: { lock?: boolean; denial?: Denial } = {},
  ): Promise<StoredBusiness> {
    const principal = await this.sessions.requirePrincipal(tx, request.session);
    if (principal.userId !== request.actorId)
      throw new DomainError('SESSION_EXPIRED');
    let business: StoredBusiness;
    try {
      business = await this.owners.resolve(tx, {
        userId: principal.userId,
        ...(request.businessKind ? { kind: request.businessKind } : {}),
        lock: options.lock ?? false,
      });
    } catch (error) {
      if (
        error instanceof DomainError &&
        (error.code === 'BUSINESS_NOT_FOUND' ||
          error.code === 'BUSINESS_NOT_OWNED')
      )
        throw new DomainError('COMMON_FORBIDDEN');
      throw error;
    }
    if (business.status !== 'approved')
      throw new DomainError(options.denial ?? 'COMMON_FORBIDDEN');
    if (!(await this.owners.sellerRole(tx, business)))
      throw new DomainError('COMMON_FORBIDDEN');
    return business;
  }
}

/**
 * Missing/deleted → PRODUCT_NOT_FOUND; another business's product →
 * PRODUCT_NOT_OWNED (spec error table).
 */
export function ownedProduct(
  row: StoredProduct | null,
  business: StoredBusiness,
): StoredProduct {
  if (!row || row.deleted) throw new DomainError('PRODUCT_NOT_FOUND');
  if (row.businessId !== business.id)
    throw new DomainError('PRODUCT_NOT_OWNED');
  return row;
}
