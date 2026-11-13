import { Inject, Injectable } from '@nestjs/common';
import type { TxContext } from '../../../shared/persistence/ports';
import { VIDEO_REPOSITORY, type VideoRepository } from '../domain/videos';

export const VIDEO_SAVED_CARDS = Symbol('VIDEO_SAVED_CARDS');
export interface VideoSavedCards {
  cards(
    tx: TxContext,
    ids: readonly string[],
  ): Promise<Array<{ id: string; caption: string }>>;
}

@Injectable()
export class VideoSavedCardsService implements VideoSavedCards {
  constructor(
    @Inject(VIDEO_REPOSITORY) private readonly videos: VideoRepository,
  ) {}

  cards(tx: TxContext, ids: readonly string[]) {
    return this.videos.savedCards(tx, ids);
  }
}
