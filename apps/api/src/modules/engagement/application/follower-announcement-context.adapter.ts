import { Inject, Injectable } from '@nestjs/common';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  FollowerAnnouncementContext,
  FollowerAnnouncementContextPort,
} from '../../notifications/application/follower-announcement-port';
import {
  FOLLOWER_INSIGHTS_REPOSITORY,
  type FollowerInsightsRepository,
} from '../domain/follower-insights';

/** Engagement's answer to Notifications' bounded announcement context read. */
@Injectable()
export class FollowerAnnouncementContextAdapter implements FollowerAnnouncementContextPort {
  constructor(
    @Inject(FOLLOWER_INSIGHTS_REPOSITORY)
    private readonly followers: FollowerInsightsRepository,
  ) {}

  async context(
    tx: TxContext,
    announcementId: string,
    maxRecipients: number,
  ): Promise<FollowerAnnouncementContext | null> {
    const announcement = await this.followers.announcement(tx, announcementId);
    if (!announcement) return null;
    const business = await this.followers.business(tx, announcement.businessId);
    return {
      announcementId,
      kind: announcement.kind,
      messageEn: announcement.messageEn,
      messageHi: announcement.messageHi,
      businessNameEn: business?.nameEn ?? null,
      businessNameHi: business?.nameHi ?? null,
      businessVisible: business?.visible ?? false,
      followerUserIds: business?.visible
        ? await this.followers.bellFollowers(tx, announcement.businessId, maxRecipients)
        : [],
    };
  }
}
