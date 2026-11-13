import { Inject, Injectable } from '@nestjs/common';
import {
  NotificationItemSchema,
  NotificationPageSchema,
  NotificationUnreadCountSchema,
  type NotificationFeedQuery,
  type NotificationItem,
  type NotificationPage,
  type NotificationUnreadCount,
} from '@apnatown/shared/notifications';
import type { UserRole } from '@apnatown/shared/users';
import { DomainError } from '../../../shared/errors/errors';
import {
  CURSOR_CODEC,
  CursorCodec,
  type CursorBinding,
} from '../../../shared/pagination/cursor';
import {
  UNIT_OF_WORK,
  type TxContext,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import {
  USER_IDENTITY,
  type UserIdentityPort,
} from '../../users/application/identity-port';
import {
  NOTIFICATION_REPOSITORY,
  type FeedFilter,
  type FeedPosition,
  type FeedRow,
  type NotificationRepository,
  type TemplateText,
} from '../domain/notification';
import { NotificationFeedAccess, type FeedRequest } from './feed-access';
import { renderTemplate } from './notification-policy';

/**
 * Own in-app inbox (F-CU-024/025, F-VD-019, F-PV-007, F-AD-017). Every call
 * re-derives the role filter and admin alert visibility; text is rendered
 * from server templates and allow-listed params only.
 */
@Injectable()
export class NotificationFeedService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notifications: NotificationRepository,
    @Inject(USER_IDENTITY) private readonly identity: UserIdentityPort,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly access: NotificationFeedAccess,
  ) {}

  list(
    request: FeedRequest,
    input: NotificationFeedQuery,
  ): Promise<NotificationPage> {
    return this.uow.run(async (tx) => {
      const filter = await this.access.filter(tx, request, input.role);
      const binding: CursorBinding = {
        operation: 'notifications.feed',
        sort: 'publishedAt-desc-id-desc',
        filters: { role: input.role },
        scope: { userId: filter.userId },
      };
      const after = this.position(input.cursor, binding);
      const rows = await this.notifications.page(tx, filter, {
        ...(after ? { after } : {}),
        limit: input.limit,
      });
      const page = rows.slice(0, input.limit);
      const last = page.at(-1);
      return NotificationPageSchema.parse({
        items: await this.render(tx, filter.userId, page),
        nextCursor:
          rows.length > input.limit && last
            ? this.cursors.encode(binding, [
                last.publishedAt.toISOString(),
                last.id,
              ])
            : null,
      });
    });
  }

  unreadCount(
    request: FeedRequest,
    role: UserRole,
  ): Promise<NotificationUnreadCount> {
    return this.uow.run(async (tx) => {
      const filter = await this.access.filter(tx, request, role);
      const count = await this.notifications.unreadCount(tx, filter);
      return NotificationUnreadCountSchema.parse({ count });
    });
  }

  /**
   * Own visible item only; another user's/role's or a no-longer-permitted
   * alert is indistinguishable from a missing one. Idempotent.
   */
  read(request: FeedRequest, id: string): Promise<void> {
    return this.uow.run(async (tx) => {
      const role = await this.notifications.ownRole(tx, request.actorId, id);
      if (!role) throw new DomainError('NOTIFICATION_NOT_FOUND');
      let filter: FeedFilter;
      try {
        filter = await this.access.filter(tx, request, role);
      } catch (error) {
        // A role the caller no longer holds hides its items entirely.
        if (error instanceof DomainError && error.code === 'COMMON_FORBIDDEN')
          throw new DomainError('NOTIFICATION_NOT_FOUND');
        throw error;
      }
      if (!(await this.notifications.markRead(tx, filter, id, this.clock.now())))
        throw new DomainError('NOTIFICATION_NOT_FOUND');
    });
  }

  /** Marks only the caller's currently visible role-bound items. */
  readAll(request: FeedRequest, role: UserRole): Promise<void> {
    return this.uow.run(async (tx) => {
      const filter = await this.access.filter(tx, request, role);
      await this.notifications.markAllRead(tx, filter, this.clock.now());
    });
  }

  private async render(
    tx: TxContext,
    userId: string,
    rows: readonly FeedRow[],
  ): Promise<NotificationItem[]> {
    if (!rows.length) return [];
    const [profile] = await this.identity.describe(tx, [userId]);
    const locale = profile?.locale ?? 'en';
    const keys = new Map(
      rows.map((row) => [
        `${row.templateKey}:${row.templateVersion}`,
        { key: row.templateKey, version: row.templateVersion },
      ]),
    );
    const texts = await this.notifications.templates(tx, [...keys.values()]);
    const pick = (row: FeedRow): TemplateText | undefined => {
      const match = texts.filter(
        (t) => t.key === row.templateKey && t.version === row.templateVersion,
      );
      return (
        match.find((t) => t.locale === locale) ??
        match.find((t) => t.locale === 'en')
      );
    };
    return rows.map((row) => {
      const text = pick(row);
      const params =
        row.params && typeof row.params === 'object' && !Array.isArray(row.params)
          ? row.params
          : {};
      const textLocale = text?.locale ?? 'en';
      return NotificationItemSchema.parse({
        id: row.id,
        category: row.category,
        title: text?.title ? renderTemplate(text.title, params, textLocale) : null,
        body: text ? renderTemplate(text.body, params, textLocale) : '',
        link: row.linkPath,
        read: row.readAt !== null,
        createdAt: row.publishedAt.toISOString(),
      });
    });
  }

  private position(
    cursor: string | undefined,
    binding: CursorBinding,
  ): FeedPosition | undefined {
    if (!cursor) return undefined;
    const [publishedAt, id] = this.cursors.decode(cursor, binding);
    if (typeof publishedAt !== 'string' || typeof id !== 'string')
      throw new DomainError('COMMON_VALIDATION_FAILED');
    return { publishedAt, id };
  }
}
