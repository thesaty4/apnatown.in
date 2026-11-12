export const PRIVATE_STORAGE = Symbol('PRIVATE_STORAGE');

/** Server-generated private object keys only; never client input or URLs. */
export const PRIVATE_OBJECT_KEY = /^[a-z0-9-]+(?:\/[a-z0-9-]+)*\.json$/;
export const PRIVATE_OBJECT_MAX_BYTES = 16 * 1024 * 1024;

/** Private artifact storage. No public object URL is ever produced. */
export interface StoragePort {
  /** Stores the complete object atomically; partial objects are never readable. */
  put(input: { key: string; body: Buffer }): Promise<void>;
  get(key: string): Promise<Buffer>;
}
