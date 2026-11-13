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
  DEFAULT_SETTINGS,
  capabilities,
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

  /**
   * The caller's own live business with this exact ID, or null. A client
   * business ID only selects; null never discloses whether it exists.
   */
  async ownedById(
    tx: TxContext,
    input: { userId: string; businessId: string; lock?: boolean },
  ): Promise<StoredBusiness | null> {
    const business = await this.businesses.find(
      tx,
      input.businessId,
      input.lock ?? false,
    );
    return business &&
      business.deletedAt === null &&
      business.ownerUserId === input.userId
      ? business
      : null;
  }

  /** True when the user owns a live business that may upload profile media. */
  async ownsMediaCapable(tx: TxContext, userId: string): Promise<boolean> {
    const rows = await this.businesses.ownedBy(tx, { ownerUserId: userId });
    return rows.some(
      (business) =>
        business.deletedAt === null &&
        capabilities(business, false).uploadMedia,
    );
  }

  /**
   * The business's Gallery default for new listing media (BusinessMediaReadPort
   * `galleryMediaDefault`), read in the caller's transaction; the platform
   * default applies when no settings row exists.
   */
  async galleryMediaDefault(
    tx: TxContext,
    businessId: string,
  ): Promise<boolean> {
    return (
      (await this.businesses.galleryMediaDefault(tx, businessId)) ??
      DEFAULT_SETTINGS.galleryMediaDefault
    );
  }

  /** Live matching vendor/provider role (never replaces approval checks). */
  sellerRole(tx: TxContext, business: StoredBusiness): Promise<boolean> {
    return this.roles.hasActiveRole(
      { userId: business.ownerUserId, role: ROLE_FOR_KIND[business.kind] },
      tx,
    );
  }
}
