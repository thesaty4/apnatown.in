import type { BusinessKind } from '@apnatown/shared/businesses';
import type { SessionBinding } from '../../../shared/auth';

/** Authenticated caller of an order route; ownership is resolved server-side. */
export interface OrderRequest {
  readonly session: SessionBinding;
  readonly actorId: string;
  readonly businessKind?: BusinessKind;
}

export interface OrderCommandRequest extends OrderRequest {
  readonly correlationId: string;
  readonly key: unknown;
}
