'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BusinessKind,
  BusinessOwner,
  BusinessProfilePatch,
} from '@apnatown/shared/businesses';
import {
  accountScope,
  queryKeys,
  type AccountScope,
} from '../../shared/api/query-keys';
import {
  privateQueryOptions,
  reconcilePrivate,
} from '../../shared/api/private-query';
import { retryTransientRead } from '../../shared/api/result';
import { useIdempotencyKey } from '../../shared/api/idempotency';
import { usePrivateMutation } from '../../shared/api/use-private-mutation';
import { useSession } from '../../shared/auth/SessionProvider';
import {
  createBusinessApplication,
  getBusinessMe,
  getExpertise,
  replaceExpertise,
  getBusinessAnalytics,
  getBusinessOverview,
  getOwnerProfile,
  patchBusinessMe,
  reactivateBusiness,
  submitBusiness,
} from './api';

/** Owner caches are partitioned by account revision AND business kind, so the
 * vendor and provider contexts of one account never read each other's data. */
export const businessKeys = {
  all: (scope: AccountScope, kind: BusinessKind) =>
    ['private', scope, 'business', kind] as const,
  me: (scope: AccountScope, kind: BusinessKind) =>
    ['private', scope, 'business', kind, 'me'] as const,
  overview: (scope: AccountScope, kind: BusinessKind) =>
    ['private', scope, 'business', kind, 'overview'] as const,
  analytics: (scope: AccountScope, kind: BusinessKind) =>
    ['private', scope, 'business', kind, 'analytics'] as const,
  /** Provider-only, versioned independently of the business profile. */
  expertise: (scope: AccountScope) =>
    ['private', scope, 'business', 'provider', 'expertise'] as const,
};

const pending = (kind: BusinessKind, part: string) =>
  ['private', 'pending', 'business', kind, part] as const;

export function useOwnerContext() {
  const { api, lifecycle, state, epoch } = useSession();
  const scope = state.kind === 'ready' ? accountScope(state.data, epoch) : null;
  return { api, lifecycle, scope };
}

export function useBusinessMe(kind: BusinessKind, enabled = true) {
  const { api, lifecycle, scope } = useOwnerContext();
  return useQuery({
    ...privateQueryOptions(
      scope ? businessKeys.me(scope, kind) : pending(kind, 'me'),
      scope?.epoch ?? 0,
      lifecycle,
      (signal) => getBusinessMe(api, kind, signal),
    ),
    enabled: enabled && scope !== null,
    // "No application yet" (404) is an answer; only transient reads retry.
    retry: retryTransientRead,
  });
}

export function useBusinessOverview(kind: BusinessKind, enabled = true) {
  const { api, lifecycle, scope } = useOwnerContext();
  return useQuery({
    ...privateQueryOptions(
      scope ? businessKeys.overview(scope, kind) : pending(kind, 'overview'),
      scope?.epoch ?? 0,
      lifecycle,
      (signal) => getBusinessOverview(api, kind, signal),
    ),
    enabled: enabled && scope !== null,
    retry: retryTransientRead,
  });
}

export function useBusinessAnalytics(kind: BusinessKind, enabled = true) {
  const { api, lifecycle, scope } = useOwnerContext();
  return useQuery({
    ...privateQueryOptions(
      scope ? businessKeys.analytics(scope, kind) : pending(kind, 'analytics'),
      scope?.epoch ?? 0,
      lifecycle,
      (signal) => getBusinessAnalytics(api, kind, signal),
    ),
    enabled: enabled && scope !== null,
    retry: retryTransientRead,
  });
}

/** Same `/users/me` projection and key as the Account screen. */
export function useOwnerPhone() {
  const { api, lifecycle, scope } = useOwnerContext();
  return useQuery({
    ...privateQueryOptions(
      scope ? queryKeys.profile(scope) : ['private', 'pending', 'profile'],
      scope?.epoch ?? 0,
      lifecycle,
      (signal) => getOwnerProfile(api, signal),
    ),
    enabled: scope !== null,
    retry: retryTransientRead,
  });
}

/** Seeds the authoritative owner DTO and marks every kind-scoped read stale. */
function useSettle(kind: BusinessKind) {
  const client = useQueryClient();
  const { scope } = useOwnerContext();
  return async (owner: BusinessOwner, assertCurrent: () => void) => {
    if (!scope) return;
    assertCurrent();
    await client.cancelQueries({ queryKey: businessKeys.me(scope, kind) });
    assertCurrent();
    client.setQueryData(businessKeys.me(scope, kind), owner);
    await client.invalidateQueries({
      queryKey: businessKeys.all(scope, kind),
      predicate: (query) => query.queryKey[4] !== 'me',
    });
  };
}

export function useCreateApplication(kind: BusinessKind) {
  const { api, lifecycle } = useOwnerContext();
  const keys = useIdempotencyKey();
  const settle = useSettle(kind);
  const mutation = usePrivateMutation(
    lifecycle,
    async (key: string, assertCurrent) => {
      const owner = await createBusinessApplication(api, kind, {
        key,
        assertCurrent,
      });
      await settle(owner, assertCurrent);
      return owner;
    },
  );
  return {
    mutation,
    create(onSuccess?: (owner: BusinessOwner) => void) {
      void mutation.run(keys.for(`create:${kind}`), (owner) => {
        keys.clear();
        onSuccess?.(owner);
      });
    },
  };
}

export function usePatchBusiness(kind: BusinessKind) {
  const { api, lifecycle } = useOwnerContext();
  const settle = useSettle(kind);
  const mutation = usePrivateMutation(
    lifecycle,
    async (patch: BusinessProfilePatch, assertCurrent) => {
      const owner = await patchBusinessMe(api, kind, patch, assertCurrent);
      await settle(owner, assertCurrent);
      return owner;
    },
  );
  return {
    mutation,
    save(
      patch: BusinessProfilePatch,
      onSuccess?: (owner: BusinessOwner) => void | Promise<void>,
    ) {
      return mutation.run(patch, onSuccess);
    },
  };
}

/** Submit/reactivate: one key per (command, version) intent, reused on retry. */
function useVersionCommand(kind: BusinessKind, name: 'submit' | 'reactivate') {
  const { api, lifecycle } = useOwnerContext();
  const keys = useIdempotencyKey();
  const settle = useSettle(kind);
  const mutation = usePrivateMutation(
    lifecycle,
    async (input: { expectedVersion: number; key: string }, assertCurrent) => {
      const run = name === 'submit' ? submitBusiness : reactivateBusiness;
      const owner = await run(api, kind, input.expectedVersion, {
        key: input.key,
        assertCurrent,
      });
      await settle(owner, assertCurrent);
      return owner;
    },
  );
  return {
    mutation,
    run(
      expectedVersion: number,
      onSuccess?: (owner: BusinessOwner) => void | Promise<void>,
    ) {
      const key = keys.for(`${name}:${kind}:${expectedVersion}`);
      return mutation.run({ expectedVersion, key }, async (owner) => {
        keys.clear();
        await onSuccess?.(owner);
      });
    },
  };
}

export const useSubmitBusiness = (kind: BusinessKind) =>
  useVersionCommand(kind, 'submit');
export const useReactivateBusiness = (kind: BusinessKind) =>
  useVersionCommand(kind, 'reactivate');

export function useExpertise(enabled = true) {
  const { api, lifecycle, scope } = useOwnerContext();
  return useQuery({
    ...privateQueryOptions(
      scope ? businessKeys.expertise(scope) : pending('provider', 'expertise'),
      scope?.epoch ?? 0,
      lifecycle,
      (signal) => getExpertise(api, signal),
    ),
    enabled: enabled && scope !== null,
    retry: retryTransientRead,
  });
}

export function useReplaceExpertise() {
  const { api, lifecycle, scope } = useOwnerContext();
  const client = useQueryClient();
  const mutation = usePrivateMutation(
    lifecycle,
    async (
      input: { subcategoryIds: string[]; expectedVersion: number },
      assertCurrent,
    ) => {
      const output = await replaceExpertise(api, input, assertCurrent);
      if (scope)
        await reconcilePrivate(
          client,
          businessKeys.expertise(scope),
          output,
          assertCurrent,
        );
      return output;
    },
  );
  return mutation;
}
