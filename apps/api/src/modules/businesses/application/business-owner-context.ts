import { Inject, Injectable } from '@nestjs/common';
import type { BusinessKind } from '@apnatown/shared/businesses';
import { DomainError } from '../../../shared/errors/errors';
import type { TxContext } from '../../../shared/persistence/ports';
import {
  USER_ROLES,
  type UserRolePort,
} from '../../users/application/user-role-port';
import {
  BUSINESS_REPOSITORY,
  ROLE_FOR_KIND,
  type BusinessRepository,
  type StoredBusiness,
} from '../domain/business';

/**
 * Resolves the authenticated owner's business server-side. `kind` comes from
 * the `X-Business-Kind` route context and only disambiguates between the
 * caller's own applications; it grants no role, ownership or approval.
 */
@Injectable()
export class BusinessOwnerContext {
  constructor(
    @Inject(BUSINESS_REPOSITORY)
    private readonly businesses: BusinessRepository,
    @Inject(USER_ROLES) private readonly roles: UserRolePort,
  ) {}

  /**
   * BUSINESS_NOT_FOUND when the user owns no live business;
   * BUSINESS_NOT_OWNED when they own none of the requested kind;
   * BUSINESS_CONTEXT_REQUIRED when both kinds exist and none was named.
   */
  async resolve(
    tx: TxContext,
    input: { userId: string; kind?: BusinessKind; lock?: boolean },
  ): Promise<StoredBusiness> {
    const rows = await this.businesses.ownedBy(tx, {
      ownerUserId: input.userId,
      ...(input.kind ? { kind: input.kind } : {}),
      lock: input.lock ?? false,
    });
    if (input.kind) {
      if (rows[0]) return rows[0];
      const other = await this.businesses.ownedBy(tx, {
        ownerUserId: input.userId,
      });
      throw new DomainError(
        other.length ? 'BUSINESS_NOT_OWNED' : 'BUSINESS_NOT_FOUND',
      );
    }
    if (rows.length > 1) throw new DomainError('BUSINESS_CONTEXT_REQUIRED');
    if (!rows[0]) throw new DomainError('BUSINESS_NOT_FOUND');
    return rows[0];
  }

  /** Live matching vendor/provider role (never replaces approval checks). */
  sellerRole(tx: TxContext, business: StoredBusiness): Promise<boolean> {
    return this.roles.hasActiveRole(
      { userId: business.ownerUserId, role: ROLE_FOR_KIND[business.kind] },
      tx,
    );
  }
}
