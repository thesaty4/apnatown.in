import type { StoragePort } from './port';

// TODO(verify): no private object storage provider is chosen yet.
export class UnavailableStorage implements StoragePort {
  async put(): Promise<never> {
    throw new Error('STORAGE_PROVIDER_NOT_CONFIGURED');
  }
  async get(): Promise<never> {
    throw new Error('STORAGE_PROVIDER_NOT_CONFIGURED');
  }
}
