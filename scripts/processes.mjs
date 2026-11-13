import { spawn, spawnSync } from 'node:child_process';

export const generationInputDirectories = [
  'apps/api/src',
  'packages/shared/src',
  'packages/ui/src',
  'packages/ui/scripts',
  'packages/api-client/src',
  'apps/web/src/shared/i18n',
  'docs/design-context',
];

export function isGenerationInput(path) {
  return (
    !path.split('/').includes('generated') &&
    !path.startsWith('apps/web/src/shared/i18n/messages/') &&
    !path.endsWith('/schema.d.ts') &&
    !['packages/ui/src/tokens.css', 'packages/ui/src/tailwind.css'].includes(
      path,
    )
  );
}

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.error)
    throw new Error(`Could not start ${command}.`, { cause: result.error });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args[0] ?? ''} failed (${result.status ?? result.signal}).`,
    );
  }
}

export function supervise(commands, { signal, timeoutMs = 10_000 } = {}) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 30_000) {
    throw new Error('Shutdown timeout must be 100..30000 milliseconds.');
  }
  return new Promise((resolve, reject) => {
    const children = new Set();
    let stopping = false;
    let failure;
    let timer;

    function kill(child, signalName) {
      try {
        if (process.platform === 'win32') child.kill(signalName);
        else if (child.pid) process.kill(-child.pid, signalName);
      } catch (error) {
        if (error.code !== 'ESRCH') failure ??= error;
      }
    }

    let finished = false;
    function finish() {
      if (finished || children.size) return;
      finished = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      if (failure) reject(failure);
      else resolve();
    }

    function stop(error) {
      failure ??= error;
      if (stopping) return;
      stopping = true;
      for (const child of children) kill(child, 'SIGTERM');
      timer = setTimeout(() => {
        for (const child of children) kill(child, 'SIGKILL');
      }, timeoutMs);
      timer.unref();
      finish();
    }

    function abort() {
      stop();
    }

    if (signal?.aborted) return resolve();
    signal?.addEventListener('abort', abort, { once: true });
    for (const { command, args, ...options } of commands) {
      const child = spawn(command, args, {
        stdio: 'inherit',
        detached: process.platform !== 'win32',
        ...options,
      });
      children.add(child);
      child.once('error', () => stop(new Error(`Could not start ${command}.`)));
      child.once('close', (code, childSignal) => {
        // An exited group leader must not leave detached descendants behind.
        kill(child, 'SIGKILL');
        children.delete(child);
        if (!stopping)
          stop(new Error(`${command} exited (${code ?? childSignal}).`));
        finish();
      });
    }
    if (!commands.length) stop(new Error('No processes were specified.'));
  });
}
