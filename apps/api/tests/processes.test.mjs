import { spawn } from 'node:child_process';
import { request } from 'node:http';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { describe, expect, it } from 'vitest';
import { runtimeEnvironment, unusedPort } from './fixtures.mjs';

function childProcess(entry, env) {
  const child = spawn(process.execPath, [`dist/${entry}.js`], {
    env: { PATH: process.env.PATH, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  child.stdout.on('data', (chunk) => {
    logs += chunk;
  });
  child.stderr.on('data', (chunk) => {
    logs += chunk;
  });
  const exited = once(child, 'exit');
  return { child, exited, logs: () => logs };
}

async function waitLive(port, child) {
  for (let attempt = 0; attempt < 80; attempt++) {
    if (child.exitCode !== null)
      throw new Error('Process exited before liveness');
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health/live`, {
        signal: AbortSignal.timeout(300),
      });
      if (response.status === 200) return;
    } catch {
      /* Bounded startup wait. */
    }
    await delay(50);
  }
  throw new Error('Liveness timed out');
}

describe('C00 API/worker child-process lifecycle', () => {
  for (const entry of ['main', 'worker']) {
    it(`${entry}: rejects invalid config before listen, without logging values`, async () => {
      const env = runtimeEnvironment({ PORT: 'invalid' });
      const process = childProcess(entry, env);
      try {
        const [code] = await process.exited;
        expect(code).toBe(1);
        expect(process.logs()).toContain('startup_failed');
        expect(process.logs()).not.toContain(env.CURSOR_SIGNING_KEY);
        expect(process.logs()).not.toContain(env.DATABASE_URL);
      } finally {
        if (process.child.exitCode === null) process.child.kill('SIGKILL');
      }
    });

    it(`${entry}: stays live but unready with DB loss and drains on SIGTERM`, async () => {
      const port = await unusedPort();
      const env = runtimeEnvironment({
        PORT: String(entry === 'main' ? port : 3001),
        WORKER_PROBE_PORT: String(entry === 'worker' ? port : 3002),
        LOG_LEVEL: 'info',
      });
      const process = childProcess(entry, env);
      try {
        await waitLive(port, process.child);
        const ready = await fetch(`http://127.0.0.1:${port}/api/health/ready`);
        expect(ready.status).toBe(503);
        expect((await ready.json()).code).toBe('COMMON_UNAVAILABLE');
        await waitLive(port, process.child);
        process.child.kill('SIGTERM');
        const [code] = await process.exited;
        expect(code).toBe(0);
        expect(process.logs()).toContain('shutdown.completed');
        expect(process.logs()).not.toContain(env.DATABASE_URL);
      } finally {
        if (process.child.exitCode === null) process.child.kill('SIGKILL');
      }
    });
  }

  it('bounds shutdown when an HTTP client never finishes its request body', async () => {
    const port = await unusedPort();
    const process = childProcess(
      'main',
      runtimeEnvironment({ PORT: String(port), LOG_LEVEL: 'info' }),
    );
    let socket;
    try {
      await waitLive(port, process.child);
      socket = request(`http://127.0.0.1:${port}/api/health/live`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': '200',
        },
      });
      socket.on('error', () => {});
      socket.write('{"unfinished":');
      await delay(150);
      process.child.kill('SIGTERM');
      const [code] = await process.exited;
      expect(code).toBe(1);
      expect(process.logs()).toContain('shutdown.deadline');
    } finally {
      socket?.destroy();
      if (process.child.exitCode === null) process.child.kill('SIGKILL');
    }
  });
});
