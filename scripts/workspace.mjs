import { watch } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import {
  createLocalEnvironment,
  environmentFor,
  readLocalEnvironment,
} from './environment.mjs';
import {
  generationInputDirectories,
  isGenerationInput,
  run,
  supervise,
} from './processes.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const [command, ...args] = process.argv.slice(2);
const cleanEnvironment = environmentFor('build', {});
const packageArgs = (name, script, extra = []) => [
  '--filter',
  `@apnatown/${name}`,
  'run',
  script,
  ...extra,
];
const packageRun = (name, script, extra = [], env = cleanEnvironment) =>
  run('pnpm', packageArgs(name, script, extra), { cwd: root, env });

function generate() {
  packageRun('shared', 'build');
  packageRun('api', 'db:generate');
  packageRun('ui', 'tokens:generate');
  packageRun('web', 'i18n:generate');
  packageRun('api', 'api:openapi');
  packageRun('api-client', 'client:generate');
  packageRun('ui', 'build');
  packageRun('api-client', 'build');
}

function runtimeCommands(values, dev = false, only) {
  const production = {
    ...values,
    NODE_ENV: dev ? 'development' : 'production',
  };
  const webUrl = new URL(values.APP_BASE_URL);
  return [
    ['apps/api/dist/main.js', [], 'api'],
    ['apps/api/dist/worker.js', [], 'worker'],
    [
      'apps/web/node_modules/next/dist/bin/next',
      [
        dev ? 'dev' : 'start',
        // 127.0.0.1 causes a redirect loop on `/` (proxy rewrite host mismatch).
        '--hostname',
        'localhost',
        '--port',
        webUrl.port || (webUrl.protocol === 'https:' ? '443' : '80'),
      ],
      'web',
    ],
  ]
    .filter(([, , owner]) => !only || owner === only)
    .map(([entry, extra, owner]) => ({
      command: process.execPath,
      args: [resolve(root, entry), ...extra],
      cwd: owner === 'web' ? resolve(root, 'apps/web') : root,
      env: environmentFor(owner === 'worker' ? 'api' : owner, production),
    }));
}

async function start(values, dev = false, only) {
  const shutdown = new AbortController();
  const listeners = ['SIGINT', 'SIGTERM'].map((signal) => {
    const handler = () => shutdown.abort();
    process.once(signal, handler);
    return [signal, handler];
  });
  try {
    if (!dev) {
      await supervise(runtimeCommands(values, false, only), {
        signal: shutdown.signal,
      });
      return;
    }
    generate();
    let childController = new AbortController();
    let group = supervise(runtimeCommands(values, true), {
      signal: childController.signal,
    });
    let restarting = false;
    let pending = false;
    let debounce;
    async function restart() {
      if (restarting || shutdown.signal.aborted) return;
      restarting = true;
      try {
        do {
          pending = false;
          childController.abort();
          await group;
          generate();
        } while (pending);
        childController = new AbortController();
        group = supervise(runtimeCommands(values, true), {
          signal: childController.signal,
        });
        group.catch((error) => {
          console.error(error.message);
          process.exitCode = 1;
          shutdown.abort();
        });
      } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
        shutdown.abort();
      } finally {
        restarting = false;
      }
    }
    const watchers = generationInputDirectories.map((directory) =>
      watch(resolve(root, directory), { recursive: true }, (_, file) => {
        if (!file || !isGenerationInput(`${directory}/${file}`)) return;
        pending = true;
        clearTimeout(debounce);
        debounce = setTimeout(restart, 200);
      }),
    );
    group.catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
      shutdown.abort();
    });
    await new Promise((resolveStopped) => {
      if (shutdown.signal.aborted) resolveStopped();
      else
        shutdown.signal.addEventListener('abort', resolveStopped, {
          once: true,
        });
    });
    clearTimeout(debounce);
    for (const watcher of watchers) watcher.close();
    childController.abort();
    await group;
  } finally {
    for (const [signal, listener] of listeners)
      process.removeListener(signal, listener);
  }
}

async function main() {
  if (command === 'env:local') {
    const created = await createLocalEnvironment(root);
    console.log(
      created ? 'Created private .env.local.' : 'Kept existing .env.local.',
    );
  } else if (command === 'generate') {
    generate();
  } else if (command === 'build') {
    generate();
    packageRun(
      'web',
      'build',
      [],
      environmentFor('web', {
        ...(await readLocalEnvironment(root)),
        NODE_ENV: 'production',
      }),
    );
  } else if (command === 'typecheck') {
    for (const name of ['shared', 'ui', 'api-client', 'api']) {
      packageRun(name, 'typecheck');
    }
    packageRun(
      'web',
      'typecheck',
      [],
      environmentFor('web', await readLocalEnvironment(root)),
    );
  } else if (command === 'check:generated') {
    packageRun('shared', 'build');
    packageRun('api', 'db:generate');
    packageRun('ui', 'check:generated');
    packageRun('web', 'check:generated');
    packageRun('api', 'check:generated');
    packageRun('api-client', 'check:generated');
  } else if (
    command === 'dev' ||
    command === 'start' ||
    command?.startsWith('start:')
  ) {
    await start(
      await readLocalEnvironment(root),
      command === 'dev',
      command.split(':')[1],
    );
  } else if (command === 'db:up' || command === 'db:down') {
    const values = await readLocalEnvironment(root);
    run(
      'docker',
      [
        'compose',
        '--env-file',
        '.env.local',
        command === 'db:up' ? 'up' : 'down',
        ...(command === 'db:up'
          ? ['-d', '--wait', '--wait-timeout', '90']
          : []),
      ],
      { cwd: root, env: environmentFor('compose', values) },
    );
    if (command === 'db:up')
      packageRun('api', 'db:provision', [], environmentFor('database', values));
  } else if (['db:migrate', 'db:seed'].includes(command)) {
    packageRun(
      'api',
      command,
      args,
      environmentFor(
        command === 'db:seed' ? 'seed' : 'database',
        await readLocalEnvironment(root),
      ),
    );
  } else if (command === 'db:generate' || command === 'api:openapi') {
    packageRun('api', command, args);
  } else if (command === 'tokens:generate') {
    packageRun('ui', command, args);
  } else if (command === 'i18n:generate') {
    packageRun('web', command, args);
  } else if (command === 'client:generate') {
    packageRun('api-client', command, args);
  } else {
    throw new Error(`Unknown workspace command: ${command ?? '(none)'}`);
  }
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
