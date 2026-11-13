import { Injectable } from '@nestjs/common';
import type { ScopeRef } from '@apnatown/shared/admin';
import { IdSchema } from '@apnatown/shared/wire';
import { DomainError } from '../errors/errors';
import type { TxContext } from '../persistence/ports';

/**
 * Resolves a resource's scopes from its owning module's data. `null` means the
 * resource does not exist. Never derived from request body/query claims.
 */
export type ScopeResolver = (
  id: string,
  tx?: TxContext,
) => Promise<readonly ScopeRef[] | null>;

/** Process-wide registry; owning modules register resolvers on init. */
@Injectable()
export class ScopeRegistry {
  private readonly resolvers = new Map<string, ScopeResolver>();

  register(key: string, resolver: ScopeResolver): void {
    if (!/^[a-z][a-z0-9_.-]{0,63}$/.test(key) || this.resolvers.has(key))
      throw new Error('INVALID_SCOPE_RESOLVER');
    this.resolvers.set(key, resolver);
  }

  async resolve(
    key: string,
    id: unknown,
    tx?: TxContext,
  ): Promise<readonly ScopeRef[]> {
    const resolver = this.resolvers.get(key);
    if (!resolver) throw new Error('UNREGISTERED_SCOPE_RESOLVER');
    const parsed = IdSchema.safeParse(id);
    if (!parsed.success) throw new DomainError('VALIDATION_ERROR');
    const scopes = await resolver(parsed.data, tx);
    if (!scopes) throw new DomainError('COMMON_NOT_FOUND');
    // An empty resolution is unresolved scope: only super_admin may pass.
    return scopes.length ? scopes : [{ cityId: null, areaId: null }];
  }
}
