import type { FollowResult } from '@apnatown/shared';
import type { SessionBinding } from '../../../shared/auth/ports';
import type { TxContext } from '../../../shared/persistence/ports';

export const FOLLOW_REPOSITORY = Symbol('FOLLOW_REPOSITORY');

export interface FollowRequest {
  session: SessionBinding;
}

export interface FollowRepository {
  state(
    tx: TxContext,
    userId: string | null,
    businessIds: readonly string[],
  ): Promise<{
    businessId: string;
    following: boolean;
    bellOn: boolean;
  }[]>;
  set(
    tx: TxContext,
    input: {
      userId: string;
      businessId: string;
      following: boolean;
      bellOn?: boolean;
      at: Date;
    },
  ): Promise<FollowResult & { changed: boolean }>;
}
