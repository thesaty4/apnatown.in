import { Inject, Injectable } from '@nestjs/common';
import {
  MediaOrderSchema,
  UpdateMediaOrderSchema,
  type JsonValue,
  type MediaOrder,
  type UpdateMediaOrder,
} from '@apnatown/shared';
import { DomainError } from '../../../shared/errors/errors';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import {
  MEDIA_GALLERY_REPOSITORY,
  type GalleryRepository,
  type MediaManagerList,
} from '../domain/media-gallery';
import type { VideoOwnerRequest } from '../domain/videos';
import { MediaOwnerCommands } from './media-owner-commands';

const parseOrder = (value: unknown) => MediaOrderSchema.parse(value) as MediaOrder & JsonValue;

/**
 * Owner manual order of the Videos or Gallery manager list. Reorder is
 * all-or-nothing: exact current membership, no duplicates, and the list
 * order version must match (`MEDIA_VERSION_CONFLICT`).
 */
@Injectable()
export class MediaOrderService {
  constructor(
    private readonly access: MediaOwnerCommands,
    @Inject(MEDIA_GALLERY_REPOSITORY) private readonly lists: GalleryRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  get(request: VideoOwnerRequest, list: MediaManagerList): Promise<MediaOrder> {
    return this.access.read(request, async (tx, business) =>
      MediaOrderSchema.parse({
        orderedIds: await this.lists.orderedIds(tx, business.id, list),
        orderVersion: await this.lists.orderVersion(tx, business.id, list),
      }),
    );
  }

  put(request: VideoOwnerRequest, list: MediaManagerList, input: UpdateMediaOrder): Promise<MediaOrder> {
    const body = UpdateMediaOrderSchema.parse(input);
    return this.access.run(
      request,
      {
        name: `media.${list}.order`,
        method: 'PUT',
        resource: `/businesses/me/${list}/order`,
        successStatus: 200,
      },
      body,
      async (tx, business) => {
        const version = await this.lists.lockOrder(tx, business.id, list);
        if (version !== body.expectedOrderVersion)
          throw new DomainError('MEDIA_VERSION_CONFLICT', { field: 'expectedOrderVersion' });
        const current = new Set(await this.lists.orderedIds(tx, business.id, list));
        if (
          current.size !== body.orderedIds.length ||
          !body.orderedIds.every((id) => current.has(id))
        )
          throw new DomainError('MEDIA_LINK_TARGET_INVALID', { field: 'orderedIds' });
        const at = this.clock.now();
        await this.lists.applyOrder(tx, business.id, list, body.orderedIds, at);
        const orderVersion = await this.lists.bumpOrder(tx, business.id, list, at);
        return parseOrder({ orderedIds: body.orderedIds, orderVersion });
      },
      parseOrder,
    );
  }
}
