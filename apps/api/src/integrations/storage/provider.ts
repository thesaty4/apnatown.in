import type { Provider } from '@nestjs/common';
import { RUNTIME_CONFIG, type RuntimeConfig } from '../../shared/config/config';
import { PRIVATE_STORAGE, type StoragePort } from './port';
import { PrivateLocalStorage } from './private-local';
import { UnavailableStorage } from './unavailable';

/** Explicit adapter selection; production has no provider yet (TODO(verify)). */
export const privateStorageProvider: Provider = {
  provide: PRIVATE_STORAGE,
  useFactory: (config: RuntimeConfig): StoragePort =>
    config.PRIVATE_STORAGE_ADAPTER === 'private-local' &&
    config.PRIVATE_STORAGE_LOCAL_DIR
      ? new PrivateLocalStorage(
          config.APP_ENV,
          config.PRIVATE_STORAGE_LOCAL_DIR,
        )
      : new UnavailableStorage(),
  inject: [RUNTIME_CONFIG],
};
