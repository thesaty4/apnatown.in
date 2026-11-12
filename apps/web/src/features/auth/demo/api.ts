import { SessionSchema, type DemoPersona } from '@apnatown/shared/auth';
import type { BrowserApi } from '../../../shared/api/browser';
import { unwrap } from '../../../shared/api/result';

/** Local/test-only demo sign-in (docs/adr/0002); the API is absent otherwise. */
export async function startDemoSession(
  api: BrowserApi,
  persona: DemoPersona,
  assertCurrent: () => void,
) {
  const header = await api.mutationHeaders();
  assertCurrent();
  unwrap(
    await api.POST('/auth/demo/sessions', {
      params: { header },
      body: { persona },
    }),
    SessionSchema,
  );
  // The live /session query owns identity. Never retain the response.
}
