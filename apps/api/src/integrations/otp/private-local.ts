import { constants } from 'node:fs';
import { lstat, mkdir, open } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { OtpDeliveryPort } from './port';

/** Explicit local delivery channel, not a bypass: normal random codes and verification apply. */
export class PrivateLocalOtpDelivery implements OtpDeliveryPort {
  constructor(environment: 'local' | 'test' | 'production') {
    if (environment === 'production') throw new Error('LOCAL_OTP_FORBIDDEN');
  }
  async send(input: Parameters<OtpDeliveryPort['send']>[0]): Promise<void> {
    if (!/^[a-f0-9-]{36}$/.test(input.challengeId))
      throw new Error('INVALID_DELIVERY_ID');
    const directory = resolve(__dirname, '../../../../../.local');
    for (const path of [directory, resolve(directory, 'otp')]) {
      await mkdir(path, { mode: 0o700 }).catch(
        (error: NodeJS.ErrnoException) => {
          if (error.code !== 'EEXIST') throw new Error('OTP_SINK_UNAVAILABLE');
        },
      );
      const stat = await lstat(path);
      if (
        !stat.isDirectory() ||
        stat.isSymbolicLink() ||
        (stat.mode & 0o077) !== 0 ||
        (process.getuid && stat.uid !== process.getuid())
      )
        throw new Error('OTP_SINK_NOT_PRIVATE');
    }
    const file = await open(
      resolve(directory, 'otp', `${input.challengeId}.json`),
      constants.O_CREAT |
        constants.O_EXCL |
        constants.O_WRONLY |
        constants.O_NOFOLLOW,
      0o600,
    );
    try {
      // No phone needed by this private local delivery channel.
      await file.writeFile(
        JSON.stringify({
          code: input.code,
          expiresAt: input.expiresAt.toISOString(),
        }),
      );
    } finally {
      await file.close();
    }
  }
}
