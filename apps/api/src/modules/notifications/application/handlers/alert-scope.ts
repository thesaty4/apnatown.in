import type { AlertScope } from '../../domain/notification';

/**
 * Normalized admin alert scope. An area without a city is not a valid
 * ScopeRef, so it degrades to global, which resolves to super admins only.
 */
export function alertScope(
  module: AlertScope['module'],
  cityId: string | null,
  areaId: string | null,
): AlertScope {
  if (cityId === null) return { module, cityId: null, areaId: null };
  return { module, cityId, areaId };
}
