import { Inject, Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type { Logger } from 'pino';
import { RUNTIME_LOGGER } from '../../../shared/logger/logger';
import { UNIT_OF_WORK, type UnitOfWork } from '../../../shared/persistence/ports';
import { IMAGE_STORAGE, MEDIA_IMAGES, variantKey, type ImageRepository, type ImageStorage } from '../domain/images';

/** Worker-only durable cleanup of expired, uncommitted upload operations. */
@Injectable()
export class ImageCleanup implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | undefined;
  private running: Promise<void> | undefined;
  private stopped = false;
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(MEDIA_IMAGES) private readonly images: ImageRepository,
    @Inject(IMAGE_STORAGE) private readonly storage: ImageStorage,
    @Inject(RUNTIME_LOGGER) private readonly logger: Logger,
  ) {}
  onModuleInit() { this.schedule(); }
  async onModuleDestroy() {
    this.stopped = true;
    clearTimeout(this.timer);
    await this.running;
  }
  private schedule() {
    if (this.stopped) return;
    this.timer = setTimeout(() => {
      this.running = this.clean().catch(() => {
        this.logger.error({ event: 'media.orphan_cleanup_failed' });
      }).finally(() => this.schedule());
    }, 60_000);
    this.timer.unref();
  }
  private async clean() {
    if (!this.storage.configured) return;
    const operations = await this.uow.run((tx) => this.images.claimCleanup(tx));
    for (const operation of operations) {
      for (let index = 0; index < operation.policy.variants.length; index++)
        await this.storage.remove(variantKey(operation.id, index + 1));
      await this.uow.run((tx) => this.images.finishCleanup(tx, operation.id));
    }
  }
}
