import { Inject, Injectable } from '@nestjs/common';
import {
  VIDEO_REPOSITORY,
  type VideoRepository,
} from '../domain/videos';
import type {
  MediaCommentTarget,
  MediaCommentTargetPort,
} from './video-comment-target.port';

@Injectable()
export class VideoCommentTargetService implements MediaCommentTargetPort {
  constructor(
    @Inject(VIDEO_REPOSITORY) private readonly videos: VideoRepository,
  ) {}

  find(tx: Parameters<MediaCommentTargetPort['find']>[0], videoId: string) {
    return this.videos.findForComments(tx, videoId) as Promise<
      MediaCommentTarget | null
    >;
  }
}
