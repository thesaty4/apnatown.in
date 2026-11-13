import { Inject, Injectable } from '@nestjs/common';
import type { BusinessKind } from '@apnatown/shared/businesses';
import type { SessionBinding } from '../../../shared/auth';
import { SESSION_ACCESS, type SessionAccess } from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';
import type { StoredBusiness } from '../domain/business';
import { BusinessOwnerContext } from './business-owner-context';

/** Authenticated owner request; the business is never client-addressed. */
export interface SellerRequest {
  readonly session: SessionBinding;
  readonly actorId: string;
  readonly businessKind?: BusinessKind;
}

/**
 * BR-06 gate for commerce owner routes in other modules (Orders, Delivery
 * handover): the caller's own APPROVED vendor/provider business with its
 * live seller role, revalidated inside the caller's transaction.
 * X-Business-Kind only selects between the caller's own businesses.
 */
@Injectable()
export class ApprovedSellerAccess {
  constructor(
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    private readonly owners: BusinessOwnerContext,
  ) {}

  async resolve(tx: TxContext, request: SellerRequest, lock = false): Promise<StoredBusiness> {
    const userId = await this.principal(tx, request);
    let business: StoredBusiness;
    try {
      business = await this.owners.resolve(tx, {
        userId,
        ...(request.businessKind ? { kind: request.businessKind } : {}),
        lock,
      });
    } catch (error) {
      if (
        error instanceof DomainError &&
        (error.code === 'BUSINESS_NOT_FOUND' || error.code === 'BUSINESS_NOT_OWNED')
      )
        throw new DomainError('COMMON_FORBIDDEN');
      throw error;
    }
    return this.approved(tx, business);
  }

  /** The caller's approved selling business with this ID, or null (no oracle). */
  async forBusiness(
    tx: TxContext,
    request: SellerRequest,
    businessId: string,
    lock = false,
  ): Promise<StoredBusiness | null> {
    const userId = await this.principal(tx, request);
    const business = await this.owners.ownedById(tx, { userId, businessId, lock });
    if (!business || business.status !== 'approved') return null;
    return (await this.owners.sellerRole(tx, business)) ? business : null;
  }

  private async principal(tx: TxContext, request: SellerRequest): Promise<string> {
    const principal = await this.sessions.requirePrincipal(tx, request.session);
    if (principal.userId !== request.actorId) throw new DomainError('SESSION_EXPIRED');
    return principal.userId;
  }

  private async approved(tx: TxContext, business: StoredBusiness): Promise<StoredBusiness> {
    if (business.status !== 'approved' || !(await this.owners.sellerRole(tx, business)))
      throw new DomainError('COMMON_FORBIDDEN');
    return business;
  }
}
