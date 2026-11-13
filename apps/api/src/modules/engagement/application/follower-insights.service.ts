import { Inject, Injectable } from '@nestjs/common';
import {
  FOLLOWER_ANNOUNCEMENT_CREATED,
  FollowerAnnouncementCreatedPayloadSchema,
  FollowerAnnouncementResultSchema,
  FollowerInsightsSchema,
  type FollowerAnnouncementCreate,
  type FollowerAnnouncementResult,
  type FollowerInsights,
} from '@apnatown/shared';
import { EVENT_FACTORY, type EventFactory } from '../../../shared/events/event-factory';
import { OUTBOX_WRITER, type OutboxWriter } from '../../../shared/events/ports';
import { COMMAND_CONTEXT_FACTORY, type HttpCommandContextFactory } from '../../../shared/idempotency/context';
import { ownerCommandContext } from '../../../shared/idempotency/owner-command';
import {
  COMMAND_UNIT_OF_WORK,
  UNIT_OF_WORK,
  type CommandUnitOfWork,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import { CLOCK, ID_PROVIDER, type Clock, type IdProvider } from '../../../shared/runtime/providers';
import {
  ApprovedSellerAccess,
  type SellerRequest,
} from '../../businesses/application/approved-seller-access';
import { receipt } from '../../catalog/application/catalog-mappers';
import {
  FOLLOWER_INSIGHTS_REPOSITORY,
  type FollowerInsightsRepository,
} from '../domain/follower-insights';

const DAY_MS = 24 * 60 * 60 * 1000;
const IST_OFFSET_MS = 330 * 60 * 1000;
const WEEKS = 8;

/** Monday (IST) of the week containing `now`, as a UTC-midnight Date of that IST date. */
function istMonday(now: Date): Date {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  const day = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()));
  return new Date(day.getTime() - ((day.getUTCDay() + 6) % 7) * DAY_MS);
}
const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export interface AnnouncementCommand extends SellerRequest {
  correlationId: string;
  key: unknown;
}

/** S-VEND-15 / S-PROV-11 follower KPIs, eight-week growth and announcements. */
@Injectable()
export class FollowerInsightsService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY) private readonly contexts: HttpCommandContextFactory,
    @Inject(FOLLOWER_INSIGHTS_REPOSITORY) private readonly followers: FollowerInsightsRepository,
    @Inject(EVENT_FACTORY) private readonly events: EventFactory,
    @Inject(OUTBOX_WRITER) private readonly outbox: OutboxWriter,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    private readonly sellers: ApprovedSellerAccess,
  ) {}

  insights(request: SellerRequest): Promise<FollowerInsights> {
    return this.uow.run(async (tx) => {
      const business = await this.sellers.resolve(tx, request);
      const now = this.clock.now();
      const current = istMonday(now);
      const starts = Array.from(
        { length: WEEKS },
        (_, index) => new Date(current.getTime() - (WEEKS - 1 - index) * 7 * DAY_MS),
      );
      const [followers, gained, approvedVideos, recent] = await Promise.all([
        this.followers.activeFollowers(tx, business.id),
        this.followers.firstFollowsByWeek(tx, {
          businessId: business.id,
          fromIstDate: isoDate(starts[0]!),
        }),
        this.followers.approvedVideos(tx, business.id),
        this.followers.recentAnnouncements(tx, business.id, 3),
      ]);
      const growth = starts.map((start, index) => ({
        start: isoDate(start),
        end: isoDate(new Date(start.getTime() + 7 * DAY_MS)),
        total: index === WEEKS - 1 ? followers : null,
        gained: gained.get(isoDate(start)) ?? 0,
      }));
      return FollowerInsightsSchema.parse({
        followers,
        gainedThisWeek: growth.at(-1)!.gained,
        approvedVideos,
        growth,
        asOf: now.toISOString(),
        definitionVersion: 'reporting-v1',
        unavailable: ['weekly_totals_history'],
        recentAnnouncements: recent,
      });
    });
  }

  /** Stores the announcement and queues Notifications' bell-on fan-out. */
  announce(
    request: AnnouncementCommand,
    input: FollowerAnnouncementCreate,
  ): Promise<FollowerAnnouncementResult> {
    const context = ownerCommandContext(
      this.contexts,
      this.clock,
      request,
      { name: 'engagement.announcement.create', resource: '/businesses/me/announcements', successStatus: 202 },
      input,
    );
    return this.commands.run(
      context,
      async (tx) => {
        const business = await this.sellers.resolve(tx, request);
        const id = this.ids.uuidv7();
        await this.followers.insertAnnouncement(tx, {
          id,
          businessId: business.id,
          kind: input.kind,
          messageEn: input.messageEn,
          messageHi: input.messageHi ?? null,
          at: this.clock.now(),
        });
        const payload = FollowerAnnouncementCreatedPayloadSchema.parse({
          announcementId: id,
          businessId: business.id,
          kind: input.kind,
          source: 'owner_announcement',
        });
        await this.outbox.append(
          tx,
          this.events.create(
            FOLLOWER_ANNOUNCEMENT_CREATED,
            { type: 'follower_announcement', id, version: 1 },
            payload,
            request.correlationId,
          ),
        );
        return FollowerAnnouncementResultSchema.parse({
          announcementId: id,
          status: 'queued',
          eligibleRecipients: await this.followers.countBellFollowers(tx, business.id),
        });
      },
      receipt(FollowerAnnouncementResultSchema),
    );
  }
}
