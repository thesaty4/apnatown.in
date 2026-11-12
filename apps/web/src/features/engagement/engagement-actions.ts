'use client';

import { failureCode } from '../../shared/api/result';
import { useSession } from '../../shared/auth/SessionProvider';
import {
  useBusinessFollowActions,
  useVideoHeartActions,
  useVideoLikes,
} from './likes-queries';

/** How the current session may use customer-only engagement actions. */
export type CustomerAccess =
  'pending' | 'customer' | 'guest' | 'forbidden' | 'unavailable';

export type EngagementErrorKey = 'rateLimited' | 'failed';

export function useCustomerAccess(): CustomerAccess {
  const { state } = useSession();
  if (state.kind === 'loading') return 'pending';
  if (state.kind === 'error')
    return state.code === 'SESSION_EXPIRED' ? 'guest' : 'unavailable';
  return state.data.roles.includes('customer') ? 'customer' : 'forbidden';
}

function errorKey(mutation: {
  isError: boolean;
  error: unknown;
}): EngagementErrorKey | undefined {
  if (!mutation.isError) return undefined;
  return failureCode(mutation.error) === 'COMMON_RATE_LIMITED'
    ? 'rateLimited'
    : 'failed';
}

export function useVideoLikeAction(videoId: string, businessId: string) {
  const access = useCustomerAccess();
  const { query, mutation } = useVideoLikes([videoId], [businessId]);
  const count = query.data?.videoCounts.find(
    (item) => item.videoId === videoId,
  );
  const liked = query.data?.likedVideoIds.includes(videoId) ?? false;
  return {
    access,
    query,
    available: count !== undefined,
    liked,
    count: count?.likeCount ?? 0,
    busy: mutation.isPending,
    errorKey: errorKey(mutation),
    toggle() {
      void mutation.run({ videoId, liked: !liked });
    },
  };
}

export function useVideoSaveAction(videoId: string, businessId: string) {
  const access = useCustomerAccess();
  const { query } = useVideoLikes([videoId], [businessId]);
  const heart = useVideoHeartActions(videoId, [businessId]);
  const saved =
    query.data?.heartedTargets.some(
      (target) => target.targetType === 'video' && target.targetId === videoId,
    ) ?? false;
  return {
    access,
    query,
    available:
      query.data?.videoCounts.some((item) => item.videoId === videoId) ?? false,
    saved,
    busy: heart.mutation.isPending,
    errorKey: errorKey(heart.mutation),
    toggle() {
      heart.toggle(!saved);
    },
  };
}

export function useBusinessFollowAction(videoId: string, businessId: string) {
  const access = useCustomerAccess();
  const { query } = useVideoLikes([videoId], [businessId]);
  const follow = useBusinessFollowActions(videoId, businessId);
  return {
    access,
    query,
    business: query.data?.businessStates.find(
      (item) => item.businessId === businessId,
    ),
    busy: follow.mutation.isPending,
    errorKey: errorKey(follow.mutation),
    set(following: boolean, bellOn: boolean, onSuccess?: () => void) {
      void follow.mutation.run({ following, bellOn }, onSuccess);
    },
  };
}
