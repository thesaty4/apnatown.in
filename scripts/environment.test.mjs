import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseEnv } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createLocalEnvironment,
  environmentFor,
  readLocalEnvironment,
  validateLocalEnvironment,
} from './environment.mjs';

const directories = [];
afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((dir) => rm(dir, { recursive: true })),
  );
});

async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), 'apnatown-env-test-'));
  directories.push(dir);
  await writeFile(join(dir, '.env.example'), await readFile('.env.example'));
  await createLocalEnvironment(dir, { APP_ENV: 'test' });
  return {
    dir,
    values: parseEnv(await readFile(join(dir, '.env.local'), 'utf8')),
  };
}

describe('C00 local configuration and ownership', () => {
  it('supplies Web tooling configuration and honors explicit test mode', async () => {
    const { dir } = await fixture();
    const values = await readLocalEnvironment(dir, { APP_ENV: 'test' });
    expect(environmentFor('web', values, {})).toMatchObject({
      APP_ENV: 'test',
      APP_BASE_URL: 'http://localhost:3000',
      API_INTERNAL_ORIGIN: 'http://localhost:3001',
    });
    expect(environmentFor('web', values, {})).not.toHaveProperty(
      'DATABASE_URL',
    );
    await expect(
      readLocalEnvironment(dir, { APP_ENV: 'production' }),
    ).rejects.toThrow();
  });

  it('generates private, distinct secrets once without overwriting existing values', async () => {
    const { dir, values } = await fixture();
    expect(values.CURSOR_SIGNING_KEY).toMatch(/^[a-f0-9]{64}$/);
    expect(values.CURSOR_SIGNING_KEY).not.toBe(values.SESSION_COOKIE_SECRET);
    expect(new URL(values.DATABASE_URL).password).not.toBe(
      new URL(values.MIGRATION_DATABASE_URL).password,
    );
    expect((await stat(join(dir, '.env.local'))).mode & 0o777).toBe(0o600);
    const before = await readFile(join(dir, '.env.local'), 'utf8');
    expect(await createLocalEnvironment(dir, { APP_ENV: 'test' })).toBe(false);
    expect(await readFile(join(dir, '.env.local'), 'utf8')).toBe(before);
  });

  it('never passes privileged credentials or inherited secrets to Web, API or builds', async () => {
    const { values } = await fixture();
    const inherited = {
      PATH: '/bin',
      DATABASE_URL: 'not-forwarded',
      SECRET: 'not-forwarded',
    };
    const web = environmentFor('web', values, inherited);
    expect(web).not.toHaveProperty('DATABASE_URL');
    expect(web).not.toHaveProperty('CURSOR_SIGNING_KEY');
    expect(web).not.toHaveProperty('SECRET');
    expect(environmentFor('api', values, inherited)).not.toHaveProperty(
      'MIGRATION_DATABASE_URL',
    );
    expect(environmentFor('build', values, inherited)).toEqual({
      PATH: '/bin',
    });
    expect(environmentFor('database', values, inherited)).toHaveProperty(
      'MIGRATION_DATABASE_URL',
    );
  });

  it('rejects production, remote hosts, shared roles, and a non-isolated shadow target', async () => {
    const { dir, values } = await fixture();
    await expect(
      createLocalEnvironment(dir, { APP_ENV: 'production' }),
    ).rejects.toThrow('production');
    expect(() =>
      validateLocalEnvironment({ ...values, APP_ENV: 'production' }),
    ).toThrow();
    expect(() =>
      validateLocalEnvironment({
        ...values,
        DATABASE_URL: values.DATABASE_URL.replace(
          '127.0.0.1',
          'example.invalid',
        ),
      }),
    ).toThrow('Unsafe');
    expect(() =>
      validateLocalEnvironment({
        ...values,
        DATABASE_URL: values.MIGRATION_DATABASE_URL,
      }),
    ).toThrow('roles');
    expect(() =>
      validateLocalEnvironment({
        ...values,
        SHADOW_DATABASE_URL: values.MIGRATION_DATABASE_URL,
      }),
    ).toThrow('shadow');
    expect(() =>
      validateLocalEnvironment({
        ...values,
        WEB_ORIGIN: 'https://example.invalid',
      }),
    ).toThrow('Unsafe');
  });

  it('rejects invalid existing config rather than silently regenerating it', async () => {
    const { dir } = await fixture();
    await writeFile(join(dir, '.env.local'), 'APP_ENV=production\n');
    await expect(
      createLocalEnvironment(dir, { APP_ENV: 'local' }),
    ).rejects.toThrow();
    expect(await readFile(join(dir, '.env.local'), 'utf8')).toBe(
      'APP_ENV=production\n',
    );
  });
});
