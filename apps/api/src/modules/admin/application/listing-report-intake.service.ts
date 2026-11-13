import { Inject, Injectable } from '@nestjs/common';
import type { JsonValue } from '@apnatown/shared';
import {
  LISTING_EVENT_TYPES,
  ListingReportAcceptedSchema,
  ListingReportedPayloadSchema,
  type ListingReportAccepted,
  type ListingReportCreate,
} from '@apnatown/shared/admin';
import type { SessionBinding } from '../../../shared/auth';
import { SESSION_ACCESS, type SessionAccess } from '../../../shared/auth/ports';
import {
  RUNTIME_CONFIG,
  type RuntimeConfig,
} from '../../../shared/config/config';
import { DomainError } from '../../../shared/errors/errors';
import {
  EVENT_FACTORY,
  type EventFactory,
} from '../../../shared/events/event-factory';
import { OUTBOX_WRITER, type OutboxWriter } from '../../../shared/events/ports';
import {
  COMMAND_CONTEXT_FACTORY,
  HttpCommandContextFactory,
} from '../../../shared/idempotency/context';
import { RECEIPT_TTL_MS } from '../../../shared/idempotency/receipt-ttl';
import {
  COMMAND_UNIT_OF_WORK,
  type CommandUnitOfWork,
  type TxContext,
} from '../../../shared/persistence/ports';
import {
  CLOCK,
  ID_PROVIDER,
  type Clock,
  type IdProvider,
} from '../../../shared/runtime/providers';
import {
  BUSINESS_ADMIN_LISTING_READ,
  type BusinessAdminListingReadPort,
} from '../../businesses/application/business-ports';
import {
  LISTING_REPORT_REPOSITORY,
  listingReportSubjectHash,
  listingReportSubjectKey,
  type ListingReportRepository,
  type StoredListingReport,
} from '../domain/listing-report';

const KIND_FOR_TYPE = { business: 'shop', provider: 'provider' } as const;

/** 5 per hour per user/anonymous session and per network address (hashed). */
export const LISTING_REPORT_LIMIT = {
  key: 'listing-reports.intake',
  maximumHits: 5,
  windowSeconds: 3600,
} as const;

export interface ListingReportRequest {
  session: SessionBinding;
  principalId: string | null;
  correlationId: string;
  key: unknown;
}

/**
 * Public listing-report intake (F-PF-007). The reporter subject is derived
 * server-side (signed-in user, else the anonymous session) and stored only as
 * a keyed hash; one open report per listing and subject. The report and its
 * `listing.reported` event commit together; duplicates and replays return
 * the same report without a second event. Details are stored as inert text
 * and never logged or published.
 */
@Injectable()
export class ListingReportIntakeService {
  private readonly subjectKey: Buffer;

  constructor(
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY)
    private readonly contexts: HttpCommandContextFactory,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(LISTING_REPORT_REPOSITORY)
    private readonly reports: ListingReportRepository,
    @Inject(BUSINESS_ADMIN_LISTING_READ)
    private readonly listings: BusinessAdminListingReadPort,
    @Inject(EVENT_FACTORY) private readonly events: EventFactory,
    @Inject(OUTBOX_WRITER) private readonly outbox: OutboxWriter,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    @Inject(RUNTIME_CONFIG) config: RuntimeConfig,
  ) {
    this.subjectKey = listingReportSubjectKey(config.CURSOR_SIGNING_KEY);
  }

  submit(
    request: ListingReportRequest,
    input: ListingReportCreate,
  ): Promise<ListingReportAccepted> {
    const command = this.contexts.create(
      {
        name: 'listing.reports.create',
        method: 'POST',
        scope: 'principal',
        successStatus: 202,
      },
      {
        // Anonymous guests are keyed by their live session.
        actorId: request.principalId ?? request.session.id,
        correlationId: request.correlationId,
        resource: '/listing-reports',
        business: null,
        expiresAt: new Date(this.clock.now().getTime() + RECEIPT_TTL_MS),
      },
      {
        key: request.key,
        payload: JSON.parse(JSON.stringify(input)) as JsonValue,
      },
    );
    return this.commands.run(
      command,
      async (tx) => {
        let userId: string | null = null;
        if (request.principalId) {
          // Revalidate the session/identity through commit.
          const principal = await this.sessions.requirePrincipal(
            tx,
            request.session,
          );
          if (principal.userId !== request.principalId)
            throw new DomainError('SESSION_EXPIRED');
          userId = principal.userId;
        }
        const target = await this.listings.publicTarget(tx, {
          businessId: input.targetId,
          kind: KIND_FOR_TYPE[input.targetType],
        });
        if (!target) throw new DomainError('COMMON_NOT_FOUND');
        const subject = userId
          ? `user:${userId}`
          : `session:${request.session.id}`;
        const { report, created } = await this.reports.openOrExisting(tx, {
          id: this.ids.uuidv7(),
          targetType: input.targetType,
          targetId: target.id,
          reporterUserId: userId,
          subjectHash: listingReportSubjectHash(this.subjectKey, subject),
          reason: input.reason,
          details: input.details ?? null,
          cityId: target.cityId,
          areaId: target.areaId,
          at: this.clock.now(),
        });
        if (created) await this.reported(tx, report, request.correlationId);
        return ListingReportAcceptedSchema.parse({
          reportId: report.id,
        }) as ListingReportAccepted & JsonValue;
      },
      {
        store: (result) => result,
        replay: (_tx, stored) =>
          Promise.resolve(
            ListingReportAcceptedSchema.parse(stored) as ListingReportAccepted &
              JsonValue,
          ),
      },
    );
  }

  /** IDs and scope only; never details or reporter identity. */
  private reported(
    tx: TxContext,
    report: StoredListingReport,
    correlationId: string,
  ): Promise<void> {
    const payload = ListingReportedPayloadSchema.parse({
      reportId: report.id,
      targetType: report.targetType,
      targetId: report.targetId,
      cityId: report.cityId,
      areaId: report.areaId,
    });
    return this.outbox.append(
      tx,
      this.events.create(
        LISTING_EVENT_TYPES.listingReported,
        { type: 'listing_report', id: report.id, version: report.version },
        payload,
        correlationId,
      ),
    );
  }
}
