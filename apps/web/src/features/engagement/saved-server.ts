import 'server-only';
import { createPrivateServerApi } from '../../shared/api/server';
import { hydrateResource } from '../../shared/api/hydration';
import { accountScope, queryKeys } from '../../shared/api/query-keys';
import { readSession } from '../../shared/auth/server';
import { resource } from '../../shared/api/result';
import { listSaved } from './saved-api';
import { savedRequest, type SavedView } from './saved-state';

export async function readSaved(view: SavedView) {
  const session = await readSession();
  const query = savedRequest(view);
  if (
    session.kind !== 'ready' ||
    !session.data.roles.includes('customer') ||
    !query
  )
    return { initial: { mutations: [], queries: [] } };
  const api = await createPrivateServerApi();
  const result = await resource(async () => ({
    pages: [await listSaved(api, query)],
    pageParams: [null],
  }));
  return {
    owner: session.data.userId,
    initial: await hydrateResource(
      queryKeys.saved(
        accountScope(session.data, 0),
        query.tab,
        query.mediaFilter,
      ),
      result,
    ),
  };
}
