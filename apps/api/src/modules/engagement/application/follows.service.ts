import { Inject, Injectable } from '@nestjs/common';
import { FollowResultSchema, type FollowUpdate } from '@apnatown/shared';
import { SESSION_ACCESS, type SessionAccess } from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import { UNIT_OF_WORK, type UnitOfWork } from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import {
  MEDIA_COMMENT_TARGET,
  type MediaCommentTargetPort,
} from '../../media-videos/application/video-comment-target.port';
import {
  FOLLOW_REPOSITORY,
  type FollowRepository,
  type FollowRequest,
} from '../domain/follows';

@Injectable()
export class FollowsService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(FOLLOW_REPOSITORY) private readonly follows: FollowRepository,
    @Inject(MEDIA_COMMENT_TARGET) private readonly media: MediaCommentTargetPort,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  set(
    request: FollowRequest,
    businessId: string,
    following: boolean,
    input?: FollowUpdate,
  ) {
    return this.uow.run(async (tx) => {
      const principal = await this.sessions.requirePrincipal(tx, request.session);
      if (!principal.roles.includes('customer')) throw new DomainError('COMMON_FORBIDDEN');
      if (following) {
        if (!input) throw new DomainError('VALIDATION_ERROR');
        const target = await this.media.find(tx, input.sourceVideoId);
        if (!target?.public || target.businessId !== businessId)
          throw new DomainError('MEDIA_VIDEO_NOT_PUBLISHED');
      }
      return FollowResultSchema.parse(await this.follows.set(tx, {
        userId: principal.userId,
        businessId,
        following,
        ...(input?.bellOn !== undefined && { bellOn: input.bellOn }),
        at: this.clock.now(),
      }));
    });
  }
}
