export function localUrl(value, username) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('INVALID_DATABASE_TARGET');
  }
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    url.hostname !== '127.0.0.1' ||
    url.port !== '5434' ||
    url.username !== username ||
    !url.password ||
    !/^\/apnatown_[a-z0-9_-]+$/.test(url.pathname) ||
    url.search ||
    url.hash
  )
    throw new Error('UNSAFE_DATABASE_TARGET');
  return url;
}

export function localTargets(env) {
  if (!['local', 'test'].includes(env.APP_ENV))
    throw new Error('LOCAL_TEST_ONLY');
  const migration = localUrl(env.MIGRATION_DATABASE_URL, 'apnatown_migrator');
  const runtime = localUrl(env.DATABASE_URL, 'apnatown_runtime');
  const shadow = localUrl(env.SHADOW_DATABASE_URL, 'apnatown_migrator');
  if (
    migration.pathname !== '/apnatown_local' ||
    runtime.pathname !== migration.pathname ||
    shadow.pathname !== '/apnatown_shadow'
  )
    throw new Error('UNSAFE_DATABASE_TARGET');
  return { migration, runtime, shadow };
}
