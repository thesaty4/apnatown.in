import createClient, { type ClientOptions } from 'openapi-fetch';
import type { paths } from './schema.js';

export type { paths, components, operations } from './schema.js';

/** No environment, cookies, singleton, or domain DTO duplication in this package. */
export function createApiClient(options: ClientOptions & { baseUrl: string }) {
  return createClient<paths>(options);
}
