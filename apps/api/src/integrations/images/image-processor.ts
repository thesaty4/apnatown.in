import { fork } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import type { ImagePolicy } from '@apnatown/shared/settings';
import type { ImageProcessor, ProcessedImage } from '../../modules/media-videos/domain/images';
import { DomainError } from '../../shared/errors/errors';

/** Output bounds follow the policy the worker was given (counts and byte budgets). */
const outputSchema = (policy: ImagePolicy) => z.object({
  result: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    variants: z.array(z.object({
      width: z.number().int().positive(), height: z.number().int().positive(),
      body: z.string().max(Math.ceil(Math.max(...policy.variants.map((v) => v.maxBytes)) / 3) * 4),
    })).min(1).max(policy.variants.length),
  }),
});

/** Separate disposable processes bound native image memory as well as JS work. */
export class SharpImageProcessor implements ImageProcessor {
  private active = 0;
  async process(body: Buffer, mime: string, policy: ImagePolicy): Promise<ProcessedImage> {
    if (process.platform !== 'linux') throw new DomainError('COMMON_UNAVAILABLE');
    if (this.active >= 2) throw new DomainError('COMMON_RATE_LIMITED', {}, 2);
    this.active++;
    try {
      return await new Promise<ProcessedImage>((resolve, reject) => {
        const child = fork(join(__dirname, 'image-worker.js'), [], {
          stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
          execArgv: ['--max-old-space-size=64'],
          env: { NODE_ENV: 'production' },
        });
        let settled = false;
        let output: ProcessedImage | undefined;
        const finish = (result?: ProcessedImage) => {
          if (settled) return;
          settled = true;
          clearTimeout(deadline);
          clearInterval(memory);
          output = result;
          child.kill('SIGKILL');
        };
        const deadline = setTimeout(() => finish(), 10_000);
        let checking = false;
        const memory = setInterval(() => {
          if (!child.pid || checking || settled) return;
          checking = true;
          void readFile(`/proc/${child.pid}/status`, 'utf8').then((status) => {
            const rss = /VmRSS:\s+(\d+)\s+kB/.exec(status);
            if (!rss || Number(rss[1]) > 256 * 1024) finish();
          }, () => finish()).finally(() => { checking = false; });
        }, 25);
        child.once('error', () => finish());
        child.once('close', () => {
          finish();
          if (output) resolve(output);
          else reject(new DomainError('MEDIA_IMAGE_PROCESSING_FAILED'));
        });
        child.once('message', (value: unknown) => {
          const result = outputSchema(policy).safeParse(value);
          if (!result.success) return finish();
          finish({
            ...result.data.result,
            variants: result.data.result.variants.map((variant) => ({
              ...variant, body: Buffer.from(variant.body, 'base64'),
            })),
          });
        });
        child.send({ body: body.toString('base64'), mime, policy }, (error) => {
          if (error) finish();
        });
      });
    } finally {
      this.active--;
    }
  }
}
