'use client';

import {
  queryOptions,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { CategoryKind, SuggestionStatus } from '@apnatown/shared/catalog';
import {
  privateInfiniteQueryOptions,
  privateQueryOptions,
} from '../../shared/api/private-query';
import {
  accountScope,
  queryKeys,
  type AccountScope,
} from '../../shared/api/query-keys';
import { normalizeFailure } from '../../shared/api/result';
import type { BrowserApi } from '../../shared/api/browser';
import { useSession } from '../../shared/auth/SessionProvider';
import type { AdminContext } from '../admin';
import { useIdempotentCommand } from '../super-admin/queries';
import type { Command } from '../super-admin/api';
import {
  checkSuggestionDuplicate,
  getAdminTree,
  getCategory,
  listAdminSuggestions,
  listCategories,
  listHomeSections,
  listKeywordMappings,
  listMySuggestions,
  type DuplicateCheckBody,
} from './api';

type Reader = Pick<BrowserApi, 'GET'>;
type Ctx = Pick<AdminContext, 'api' | 'scope' | 'lifecycle'>;
const referenceStaleTime = 5 * 60_000;

async function guarded<T>(read: () => Promise<T>, signal: AbortSignal) {
  try {
    const data = await read();
    signal.throwIfAborted();
    return data;
  } catch (error) {
    signal.throwIfAborted();
    throw normalizeFailure(error);
  }
}

// --- Public taxonomy (both EN/HI names in every response) -----------------

export function categoriesOptions(api: Reader, kind?: CategoryKind) {
  return queryOptions({
    queryKey: queryKeys.catalogCategories(kind),
    staleTime: referenceStaleTime,
    queryFn: ({ signal }) =>
      guarded(() => listCategories(api, kind, signal), signal),
  });
}

export function categoryOptions(api: Reader, slug: string) {
  return queryOptions({
    queryKey: queryKeys.catalogCategory(slug),
    staleTime: referenceStaleTime,
    queryFn: ({ signal }) =>
      guarded(() => getCategory(api, slug, signal), signal),
  });
}

// --- Owner suggestions ----------------------------------------------------

/** Signed-in owner context; null until the session is ready. */
export function useOwnerScope(): {
  api: BrowserApi;
  lifecycle: ReturnType<typeof useSession>['lifecycle'];
  scope: AccountScope | null;
} {
  const { api, lifecycle, state, epoch } = useSession();
  return {
    api,
    lifecycle,
    scope: state.kind === 'ready' ? accountScope(state.data, epoch) : null,
  };
}

export function useMySuggestions() {
  const { api, lifecycle, scope } = useOwnerScope();
  const options = privateInfiniteQueryOptions(
    scope
      ? queryKeys.catalogSuggestions(scope)
      : ['private', 'pending', 'catalog', 'suggestions'],
    scope?.epoch ?? 0,
    lifecycle,
    (cursor, signal) => listMySuggestions(api, cursor, signal),
  );
  return useInfiniteQuery({ ...options, enabled: scope !== null });
}

/** Debounced input → read-only duplicate check (a CSRF-protected POST). */
export function useDuplicateCheck(body: DuplicateCheckBody | null) {
  const { api, lifecycle, scope } = useOwnerScope();
  const check = body && {
    categoryId: body.categoryId,
    nameEn: body.nameEn,
    nameHi: body.nameHi,
  };
  const options = privateQueryOptions(
    scope && check
      ? queryKeys.catalogDuplicateCheck(scope, check)
      : ['private', 'pending', 'catalog', 'duplicate-check'],
    scope?.epoch ?? 0,
    lifecycle,
    () => {
      if (!body) throw new Error('No body');
      const epoch = scope?.epoch ?? 0;
      return checkSuggestionDuplicate(api, body, () => lifecycle.assert(epoch));
    },
  );
  return useQuery({
    ...options,
    enabled: scope !== null && body !== null,
    staleTime: 30_000,
    retry: false,
  });
}

// --- Admin reads ----------------------------------------------------------

export function adminTreeOptions({ api, scope, lifecycle }: Ctx) {
  return privateQueryOptions(
    queryKeys.adminCatalogTree(scope),
    scope.epoch,
    lifecycle,
    (signal) => getAdminTree(api, signal),
  );
}

export function homeSectionsOptions({ api, scope, lifecycle }: Ctx) {
  return privateQueryOptions(
    queryKeys.adminCatalogHomeSections(scope),
    scope.epoch,
    lifecycle,
    (signal) => listHomeSections(api, signal),
  );
}

export function adminSuggestionsOptions(
  { api, scope, lifecycle }: Ctx,
  status: SuggestionStatus,
) {
  return privateInfiniteQueryOptions(
    queryKeys.adminCatalogSuggestions(scope, status),
    scope.epoch,
    lifecycle,
    (cursor, signal) => listAdminSuggestions(api, status, cursor, signal),
  );
}

export function keywordsOptions({ api, scope, lifecycle }: Ctx) {
  return privateInfiniteQueryOptions(
    queryKeys.adminCatalogKeywords(scope),
    scope.epoch,
    lifecycle,
    (cursor, signal) => listKeywordMappings(api, cursor, signal),
  );
}

/** Admin catalog command: the shared command refreshes every admin read for
 * this scope; taxonomy changes also refresh the public browser taxonomy. */
export function useCatalogCommand<Body, Output>(
  operation: (api: BrowserApi, body: Body, command: Command) => Promise<Output>,
) {
  const client = useQueryClient();
  const command = useIdempotentCommand(operation);
  return {
    ...command,
    submit(body: Body, onSuccess: (output: Output) => void) {
      command.submit(body, (output) => {
        void client.invalidateQueries({ queryKey: queryKeys.catalog });
        onSuccess(output);
      });
    },
  };
}
