import type { FollowerAnnouncementKind } from '@apnatown/shared';
import type { TxContext } from '../../../shared/persistence/ports';

export const FOLLOWER_ANNOUNCEMENT_CONTEXT = Symbol('FOLLOWER_ANNOUNCEMENT_CONTEXT');

/** Bounded internal context for one owner announcement (Engagement-owned). */
export interface FollowerAnnouncementContext {
  announcementId: string;
  kind: FollowerAnnouncementKind;
  messageEn: string | null;
  messageHi: string | null;
  businessNameEn: string | null;
  businessNameHi: string | null;
  /** Business still approved and live; otherwise nothing is sent. */
  businessVisible: boolean;
  /** Current active followers with the bell on, rechecked at fan-out time. */
  followerUserIds: readonly string[];
}

export interface FollowerAnnouncementContextPort {
  context(
    tx: TxContext,
    announcementId: string,
    maxRecipients: number,
  ): Promise<FollowerAnnouncementContext | null>;
}
