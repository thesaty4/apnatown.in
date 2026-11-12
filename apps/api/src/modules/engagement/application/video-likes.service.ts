import { Inject, Injectable } from '@nestjs/common';
import type { EngagementStateQuery, VideoHeartResult, VideoLikeResult } from '@apnatown/shared';
import { SESSION_ACCESS, type SessionAccess, type SessionBinding } from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import { EVENT_FACTORY, type EventFactory } from '../../../shared/events/event-factory';
import { OUTBOX_WRITER, type OutboxWriter } from '../../../shared/events/ports';
import { UNIT_OF_WORK, type UnitOfWork } from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import {
  MEDIA_COMMENT_TARGET,
  type MediaCommentTargetPort,
} from '../../media-videos/application/video-comment-target.port';
import {
  VIDEO_HEART_REPOSITORY,
  type VideoHeartRepository,
} from '../domain/hearts';
import {
  FOLLOW_REPOSITORY,
  type FollowRepository,
} from '../domain/follows';
import {
  VIDEO_LIKE_REPOSITORY,
  type VideoLikeRepository,
  type VideoLikeRequest,
} from '../domain/likes';

@Injectable()
export class VideoLikesService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(VIDEO_LIKE_REPOSITORY) private readonly likes: VideoLikeRepository,
    @Inject(VIDEO_HEART_REPOSITORY) private readonly hearts: VideoHeartRepository,
    @Inject(FOLLOW_REPOSITORY) private readonly follows: FollowRepository,
    @Inject(MEDIA_COMMENT_TARGET) private readonly media: MediaCommentTargetPort,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(EVENT_FACTORY) private readonly events: EventFactory,
    @Inject(OUTBOX_WRITER) private readonly outbox: OutboxWriter,
  ) {}

  state(session: SessionBinding | null, query: EngagementStateQuery) {
    const videoIds = [...new Set(query.videoIds?.toLowerCase().split(',') ?? [])].sort();
    return this.uow.run(async (tx) => {
      const principal = session ? await this.sessions.requirePrincipal(tx, session) : null;
      const userId = principal?.roles.includes('customer') ? principal.userId : null;
      const businessIds = [...new Set(query.businessIds?.toLowerCase().split(',') ?? [])].sort();
      const publicVideoIds: string[] = [];
      for (const id of videoIds) {
        const target = await this.media.find(tx, id);
        if (target?.public) publicVideoIds.push(id);
      }
      const state = await this.likes.state(tx, userId, videoIds, publicVideoIds);
      const heartVideoIds = (query.targets?.toLowerCase().split(',') ?? [])
        .flatMap((target) => {
          const [targetType, targetId] = target.split(':');
          return targetType === 'video' && targetId ? [targetId] : [];
        });
      const heartedVideoIds = await this.hearts.findOwned(
        tx,
        userId,
        [...new Set(heartVideoIds)],
      );
      const businessStates = await this.follows.state(tx, userId, businessIds);
      return {
        ...state,
        heartedTargets: heartedVideoIds.map((targetId) => ({
          targetType: 'video' as const,
          targetId,
        })),
        businessStates,
      };
    });
  }

  set(request: VideoLikeRequest, videoId: string, liked: boolean): Promise<VideoLikeResult> {
    return this.uow.run(async (tx) => {
      const principal = await this.sessions.requirePrincipal(tx, request.session);
      if (!principal.roles.includes('customer')) throw new DomainError('COMMON_FORBIDDEN');
      const target = await this.media.find(tx, videoId);
      if (liked && !target?.public) throw new DomainError('MEDIA_VIDEO_NOT_PUBLISHED');
      // A missing target cannot retain a relationship because of the FK.
      if (!target) return { liked: false, likeCount: 0 };
      const result = await this.likes.set(tx, {
        userId: principal.userId,
        videoId,
        liked,
        at: this.clock.now(),
      });
      if (result.changed) {
        await this.outbox.append(tx, this.events.create(
          liked ? 'engagement.liked' : 'engagement.unliked',
          { type: 'video_engagement', id: videoId, version: result.version },
          {
            videoId,
            businessId: target.businessId,
            userId: principal.userId,
            likeCount: result.likeCount,
            version: result.version,
          },
          request.correlationId,
        ));
      }
      return { liked: result.liked, likeCount: result.likeCount };
    });
  }

  setHeart(
    request: VideoLikeRequest,
    videoId: string,
    hearted: boolean,
  ): Promise<VideoHeartResult> {
    return this.uow.run(async (tx) => {
      const principal = await this.sessions.requirePrincipal(tx, request.session);
      if (!principal.roles.includes('customer')) throw new DomainError('COMMON_FORBIDDEN');
      if (hearted) {
        const target = await this.media.find(tx, videoId);
        if (!target?.public) throw new DomainError('MEDIA_VIDEO_NOT_PUBLISHED');
      }
      await this.hearts.set(tx, {
        userId: principal.userId,
        videoId,
        hearted,
        at: this.clock.now(),
      });
      return { hearted };
    });
  }
}
