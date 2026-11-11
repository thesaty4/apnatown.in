import { describe, expect, it } from 'vitest';
import {
  generationInputDirectories,
  isGenerationInput,
  run,
  supervise,
} from './processes.mjs';

const node = (source) => ({
  command: process.execPath,
  args: ['-e', source],
  stdio: 'ignore',
});

describe('C00 process lifecycle', () => {
  it('rebuilds source changes but not the resulting generated outputs', () => {
    const events = [
      'packages/ui/src/primitives/Button.tsx',
      'packages/ui/src/tokens.css',
      'packages/ui/src/tailwind.css',
      'packages/api-client/src/schema.d.ts',
      'apps/api/src/shared/persistence/generated/client.ts',
      'apps/web/src/shared/i18n/messages/en.json',
    ];
    expect(events.filter(isGenerationInput)).toEqual([events[0]]);
    expect(isGenerationInput('packages/ui/scripts/generate-tokens.mjs')).toBe(
      true,
    );
  });

  it('watches catalogue inputs without watching generated catalogue output', () => {
    for (const input of [
      'apps/web/src/shared/i18n/source-key-map.json',
      'apps/web/src/shared/i18n/reviewed-additions.json',
    ]) {
      expect(
        generationInputDirectories.some((directory) =>
          input.startsWith(`${directory}/`),
        ),
      ).toBe(true);
      expect(isGenerationInput(input)).toBe(true);
    }
    expect(isGenerationInput('apps/web/src/shared/i18n/messages/hi.json')).toBe(
      false,
    );
  });

  it('propagates command failures', () => {
    expect(() =>
      run(process.execPath, ['-e', 'process.exit(3)'], { stdio: 'ignore' }),
    ).toThrow('failed');
  });

  it('stops siblings when a required child exits', async () => {
    await expect(
      supervise(
        [node('setInterval(() => {}, 1000)'), node('process.exit(2)')],
        { timeoutMs: 100 },
      ),
    ).rejects.toThrow('exited');
  });

  it('drains a cancelled group, with a deadline for unresponsive children', async () => {
    const controller = new AbortController();
    const group = supervise(
      [node("process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)")],
      { signal: controller.signal, timeoutMs: 100 },
    );
    setTimeout(() => controller.abort(), 150);
    await expect(group).resolves.toBeUndefined();
  });

  it('rejects unbounded shutdown timeouts', () => {
    expect(() => supervise([], { timeoutMs: 0 })).toThrow('timeout');
  });
});
