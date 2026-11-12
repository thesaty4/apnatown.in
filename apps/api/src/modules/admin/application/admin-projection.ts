import { Inject, Injectable } from '@nestjs/common';
import {
  AdminCardSchema,
  type AdminCard,
  type AreaRef,
  type CityRef,
} from '@apnatown/shared/admin';
import type { AdminReadContext } from '../../../shared/auth/ports';
import {
  IDENTITY_CRYPTO,
  type IdentityCrypto,
} from '../../../shared/auth/crypto';
import type { TxContext } from '../../../shared/persistence/ports';
import {
  GEO_SCOPE,
  type GeoScopePort,
} from '../../geo/application/geo-scope.port';
import {
  USER_ADMIN_READ,
  type UserAdminReadPort,
} from '../../users/application/user-role-port';
import type { AdminGrants } from '../domain/admin';

export const adminEmailContext = (userId: string) => `admin:${userId}:email`;

/** Builds super-admin admin cards; contacts come from the Users port. */
@Injectable()
export class AdminProjection {
  constructor(
    @Inject(IDENTITY_CRYPTO) private readonly crypto: IdentityCrypto,
    @Inject(GEO_SCOPE) private readonly geo: GeoScopePort,
    @Inject(USER_ADMIN_READ) private readonly contacts: UserAdminReadPort,
  ) {}

  encryptEmail(userId: string, email: string): string {
    return this.crypto.encrypt(email, adminEmailContext(userId));
  }
  email(grants: AdminGrants): string {
    return this.crypto.decrypt(
      grants.account.emailCiphertext,
      adminEmailContext(grants.account.userId),
    );
  }

  async cards(
    tx: TxContext,
    ctx: AdminReadContext,
    list: readonly AdminGrants[],
  ): Promise<AdminCard[]> {
    if (!list.length) return [];
    const areaIds = list.flatMap((grants) =>
      grants.areaGrants.map((grant) => grant.areaId),
    );
    const areas = new Map<string, AreaRef>(
      (await this.geo.describeAreas(areaIds, tx)).map((area) => [
        area.id,
        area,
      ]),
    );
    const cityIds = list.flatMap((grants) => [
      ...grants.cityWideIds,
      ...grants.areaGrants.map((grant) => grant.cityId),
    ]);
    const cities = new Map<string, CityRef>(
      (await this.geo.describeCities(cityIds, tx)).map((city) => [
        city.id,
        city,
      ]),
    );
    const phones = new Map(
      (
        await this.contacts.adminContacts(
          ctx,
          { userIds: list.map((grants) => grants.account.userId) },
          tx,
        )
      ).map((contact) => [contact.userId, contact.phoneE164]),
    );
    return list.map((grants) => {
      const { account } = grants;
      const ownCityIds = [
        ...new Set([
          ...grants.areaGrants.map((grant) => grant.cityId),
          ...grants.cityWideIds,
        ]),
      ];
      return AdminCardSchema.parse({
        id: account.userId,
        name: account.displayName,
        phoneE164: phones.get(account.userId) ?? null,
        email: this.email(grants),
        role: { id: account.roleId, name: account.roleName },
        status: account.status,
        areas: grants.areaGrants.flatMap((grant) => {
          const area = areas.get(grant.areaId);
          return area ? [area] : [];
        }),
        // Grouped city labels for display; never city authority by themselves.
        cities: ownCityIds.flatMap((id) => {
          const city = cities.get(id);
          return city ? [city] : [];
        }),
        // No authoritative Geo zone→area mapping exists yet.
        zones: [],
        cityWideIds: grants.cityWideIds,
        communicationScopes: account.communicationScopes,
        permissions: grants.permissions,
        lastActiveAt: account.lastActiveAt,
        version: account.version,
        createdAt: account.createdAt,
        unavailable: ['zones'],
      });
    });
  }
}
