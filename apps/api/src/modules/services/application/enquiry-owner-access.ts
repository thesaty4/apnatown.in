import { Inject, Injectable } from '@nestjs/common';
import type { BusinessKind } from '@apnatown/shared/businesses';
import type { SessionBinding } from '../../../shared/auth';
import { SESSION_ACCESS, type SessionAccess } from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';
import { BusinessOwnerContext } from '../../businesses/application/business-owner-context';
import type { StoredBusiness } from '../../businesses/domain/business';

/** Authenticated vendor/provider; the business is resolved server-side. */
export interface EnquiryOwnerRequest {
  session: SessionBinding;
  actorId: string;
  businessKind?: BusinessKind;
}

/**
 * Resolves the owner business (enquiry inbox, service manager) inside the
 * caller's transaction; `lock` row-locks it so a concurrent suspension cannot
 * interleave with a write.
 */
@Injectable()
export class EnquiryOwnerAccess {
  constructor(
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    private readonly owners: BusinessOwnerContext,
  ) {}

  /**
   * Live session + the caller's own vendor/provider business (X-Business-Kind
   * only selects between the caller's own businesses) with its live seller
   * role. Anything else is COMMON_FORBIDDEN without disclosing records.
   */
  async resolve(
    tx: TxContext,
    request: EnquiryOwnerRequest,
    lock = false,
  ): Promise<StoredBusiness> {
    const principal = await this.sessions.requirePrincipal(tx, request.session);
    if (principal.userId !== request.actorId)
      throw new DomainError('SESSION_EXPIRED');
    let business: StoredBusiness;
    try {
      business = await this.owners.resolve(tx, {
        userId: principal.userId,
        ...(request.businessKind ? { kind: request.businessKind } : {}),
        lock,
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
    if (!(await this.owners.sellerRole(tx, business)))
      throw new DomainError('COMMON_FORBIDDEN');
    return business;
  }
}
