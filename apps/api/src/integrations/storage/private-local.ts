import { randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, mkdir, open, rename, unlink } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import {
  PRIVATE_OBJECT_KEY,
  PRIVATE_OBJECT_MAX_BYTES,
  type StoragePort,
} from './port';

/** Local/test private artifact store in a configured owner-only directory. */
export class PrivateLocalStorage implements StoragePort {
  constructor(
    environment: 'local' | 'test' | 'production',
    private readonly root: string,
  ) {
    if (environment === 'production')
      throw new Error('LOCAL_STORAGE_FORBIDDEN');
    if (!isAbsolute(root)) throw new Error('STORAGE_ROOT_INVALID');
  }

  async put(input: { key: string; body: Buffer }): Promise<void> {
    if (input.body.byteLength > PRIVATE_OBJECT_MAX_BYTES)
      throw new Error('STORAGE_OBJECT_TOO_LARGE');
    const path = this.path(input.key);
    await this.directories(dirname(path));
    // Write a private temporary file, then rename so readers see whole objects.
    const temporary = `${path}.${randomUUID()}.tmp`;
    const file = await open(
      temporary,
      constants.O_CREAT |
        constants.O_EXCL |
        constants.O_WRONLY |
        constants.O_NOFOLLOW,
      0o600,
    );
    try {
      await file.writeFile(input.body);
      await file.sync();
    } catch (error) {
      await file.close();
      await unlink(temporary).catch(() => undefined);
      throw error;
    }
    await file.close();
    await rename(temporary, path);
  }

  async get(key: string): Promise<Buffer> {
    const file = await open(
      this.path(key),
      constants.O_RDONLY | constants.O_NOFOLLOW,
    );
    try {
      const stat = await file.stat();
      if (!stat.isFile() || stat.size > PRIVATE_OBJECT_MAX_BYTES)
        throw new Error('STORAGE_OBJECT_INVALID');
      return await file.readFile();
    } finally {
      await file.close();
    }
  }

  private path(key: string): string {
    if (!PRIVATE_OBJECT_KEY.test(key)) throw new Error('STORAGE_KEY_INVALID');
    const path = resolve(this.root, key);
    const inside = relative(this.root, path);
    if (!inside || inside.startsWith('..') || isAbsolute(inside))
      throw new Error('STORAGE_KEY_INVALID');
    return path;
  }

  private async directories(target: string): Promise<void> {
    const paths = [this.root];
    for (const part of relative(this.root, target).split(sep).filter(Boolean))
      paths.push(resolve(paths[paths.length - 1] ?? this.root, part));
    for (const path of paths) {
      const recursive = path === this.root;
      await mkdir(path, { mode: 0o700, recursive }).catch(
        (error: NodeJS.ErrnoException) => {
          if (error.code !== 'EEXIST') throw new Error('STORAGE_UNAVAILABLE');
        },
      );
      const stat = await lstat(path);
      if (
        !stat.isDirectory() ||
        stat.isSymbolicLink() ||
        (stat.mode & 0o077) !== 0 ||
        (process.getuid && stat.uid !== process.getuid())
      )
        throw new Error('STORAGE_NOT_PRIVATE');
    }
  }
}
