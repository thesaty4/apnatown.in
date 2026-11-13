import type { FollowerAnnouncementKind } from '@apnatown/shared';
import type { TxContext } from '../../../shared/persistence/ports';

export interface StoredAnnouncement {
  id: string;
  businessId: string;
  kind: FollowerAnnouncementKind;
  messageEn: string | null;
  messageHi: string | null;
  createdAt: string;
}

export const FOLLOWER_INSIGHTS_REPOSITORY = Symbol('FOLLOWER_INSIGHTS_REPOSITORY');

/** Owner follower reads/writes for one business (Engagement owns follows). */
export interface FollowerInsightsRepository {
  activeFollowers(tx: TxContext, businessId: string): Promise<number>;
  /** IST week start (YYYY-MM-DD, Monday) → first-ever follows that week. */
  firstFollowsByWeek(
    tx: TxContext,
    input: { businessId: string; fromIstDate: string },
  ): Promise<Map<string, number>>;
  approvedVideos(tx: TxContext, businessId: string): Promise<number>;
  recentAnnouncements(tx: TxContext, businessId: string, limit: number): Promise<StoredAnnouncement[]>;
  /** Active followers with the bell on (eligible recipients). */
  bellFollowers(tx: TxContext, businessId: string, limit: number): Promise<string[]>;
  countBellFollowers(tx: TxContext, businessId: string): Promise<number>;
  insertAnnouncement(
    tx: TxContext,
    input: Omit<StoredAnnouncement, 'createdAt'> & { at: Date },
  ): Promise<void>;
  announcement(tx: TxContext, id: string): Promise<StoredAnnouncement | null>;
  /** Names + whether the business is still approved and not deleted. */
  business(
    tx: TxContext,
    businessId: string,
  ): Promise<{ nameEn: string | null; nameHi: string | null; visible: boolean } | null>;
}
