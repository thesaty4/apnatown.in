import { DiscoveryLocationSchema, type DiscoveryLocation } from '@apnatown/shared/search';
import type { AuthRequest } from '../../../shared/auth';
import { DomainError } from '../../../shared/errors/errors';

/** Ephemeral request context only; precise location never enters a URL or cursor payload. */
export function discoveryLocation(request: AuthRequest): DiscoveryLocation | null {
  const latitude = request.headers['x-discovery-latitude'];
  const longitude = request.headers['x-discovery-longitude'];
  if (latitude === undefined && longitude === undefined) return null;
  const parsed = DiscoveryLocationSchema.safeParse({ latitude, longitude });
  if (!parsed.success) throw new DomainError('COMMON_VALIDATION_FAILED');
  return parsed.data;
}
