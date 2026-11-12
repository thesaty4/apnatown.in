import { ConsentNoticeVersionSchema } from '@apnatown/shared/users';
import { z } from 'zod';

const blank = (value: unknown) => (value === '' ? undefined : value);
const integer = (min: number, max: number, fallback: number) =>
  z.coerce.number().int().min(min).max(max).default(fallback);
const schema = z.object({
  APP_ENV: z.enum(['local', 'test', 'production']),
  DATABASE_URL: z.string().url(),
  WEB_ORIGIN: z.string().url(),
  CURSOR_SIGNING_KEY: z.string().regex(/^[A-Za-z0-9_-]{43,128}$/),
  IDEMPOTENCY_HASH_KEY: z.string().regex(/^[a-f0-9]{64}$/),
  PII_ENCRYPTION_KEY: z.string().regex(/^[a-f0-9]{64}$/),
  PHONE_LOOKUP_HASH_KEY: z.string().regex(/^[a-f0-9]{64}$/),
  OTP_HASH_KEY: z.string().regex(/^[a-f0-9]{64}$/),
  ANONYMOUS_SESSION_TTL_SECONDS: z.coerce.number().int().min(1).max(3600),
  SESSION_TTL_SECONDS: z.coerce.number().int().min(1).max(2592000),
  OTP_TTL_SECONDS: z.coerce.number().int().min(1).max(900),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10),
  OTP_PHONE_REQUESTS_PER_HOUR: z.coerce.number().int().min(1).max(100),
  OTP_DELIVERY_ADAPTER: z.enum(['private-local', 'unavailable']),
  PORT: integer(1, 65535, 3001),
  WORKER_PROBE_PORT: integer(1, 65535, 3002),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  SHUTDOWN_TIMEOUT_MS: integer(100, 30000, 10000),
  JOB_RETRY_LIMIT: integer(0, 10, 3),
  JOB_RETRY_DELAY_MS: integer(100, 60000, 1000),
  IDEMPOTENCY_LEASE_MS: integer(10000, 300000, 30000),
  RUNTIME_CLEANUP_INTERVAL_MS: integer(1000, 3600000, 60000),
  RUNTIME_CLEANUP_BATCH_SIZE: integer(1, 500, 100),
  OUTBOX_RELAY_POLL_INTERVAL_MS: integer(100, 60000, 1000),
  OUTBOX_RELAY_BATCH_SIZE: integer(1, 20, 10),
  OUTBOX_RELAY_LEASE_MS: integer(10000, 300000, 30000),
  // Approved consent notice copy version (Q-31). Unset keeps grants unavailable.
  CONSENT_NOTICE_VERSION: z.preprocess(
    blank,
    ConsentNoticeVersionSchema.optional(),
  ),
  // Private generated-artifact storage. No provider is approved yet
  // (TODO(verify)); `unavailable` keeps export artifacts from being stored.
  PRIVATE_STORAGE_ADAPTER: z.preprocess(
    blank,
    z.enum(['private-local', 'unavailable']).default('unavailable'),
  ),
  PRIVATE_STORAGE_LOCAL_DIR: z.preprocess(
    blank,
    z
      .string()
      .regex(/^\/[^\0]*$/)
      .optional(),
  ),
  // Q-32 policy values. Unset keeps export/deletion requests `blocked` with
  // POLICY_PENDING (and no deletion completion capability) instead of
  // guessing retention periods or SLAs.
  DATA_EXPORT_TTL_SECONDS: z.preprocess(
    blank,
    z.coerce.number().int().min(60).max(2592000).optional(),
  ),
  DATA_DELETION_POLICY_VERSION: z.preprocess(
    blank,
    ConsentNoticeVersionSchema.optional(),
  ),
  DATA_DELETION_COMPLETION_TTL_SECONDS: z.preprocess(
    blank,
    z.coerce.number().int().min(60).max(2592000).optional(),
  ),
});

export type RuntimeConfig = z.infer<typeof schema>;
export const RUNTIME_CONFIG = Symbol('RUNTIME_CONFIG');
const loopback = new Set(['localhost', '127.0.0.1', '[::1]']);

export function parseConfig(env: NodeJS.ProcessEnv): RuntimeConfig {
  // Do not attach Zod issues: URLs, rejected values and key material must never reach logs.
  const result = schema.safeParse(env);
  if (!result.success) throw new Error('INVALID_RUNTIME_CONFIG');
  const config = result.data;
  const db = new URL(config.DATABASE_URL);
  const web = new URL(config.WEB_ORIGIN);
  const local = config.APP_ENV !== 'production';
  const keys = [
    config.PII_ENCRYPTION_KEY,
    config.PHONE_LOOKUP_HASH_KEY,
    config.OTP_HASH_KEY,
    config.IDEMPOTENCY_HASH_KEY,
    config.CURSOR_SIGNING_KEY,
  ];
  if (
    new Set(keys).size !== keys.length ||
    keys.some((key) => /^(.)\1+$/.test(key)) ||
    (!local && config.OTP_DELIVERY_ADAPTER === 'private-local') ||
    (!local && config.PRIVATE_STORAGE_ADAPTER === 'private-local') ||
    (config.PRIVATE_STORAGE_ADAPTER === 'private-local' &&
      !config.PRIVATE_STORAGE_LOCAL_DIR) ||
    !['postgres:', 'postgresql:'].includes(db.protocol) ||
    !db.username ||
    !db.password ||
    !/^\/[a-z][a-z0-9_]*$/.test(db.pathname) ||
    db.hash ||
    ['postgres', 'apnatown_migrator'].includes(
      decodeURIComponent(db.username),
    ) ||
    (local &&
      (!loopback.has(db.hostname) || db.username !== 'apnatown_runtime')) ||
    (local && !loopback.has(web.hostname)) ||
    (!local && web.protocol !== 'https:') ||
    !['http:', 'https:'].includes(web.protocol) ||
    web.username ||
    web.password ||
    web.search ||
    web.hash ||
    web.pathname !== '/' ||
    config.PORT === config.WORKER_PROBE_PORT ||
    env.MIGRATION_DATABASE_URL ||
    env.SHADOW_DATABASE_URL ||
    env.POSTGRES_PASSWORD ||
    Object.keys(env).some((key) => /(?:FAKE|MOCK|BYPASS)/i.test(key))
  )
    throw new Error('INVALID_RUNTIME_CONFIG');
  return Object.freeze(config);
}
