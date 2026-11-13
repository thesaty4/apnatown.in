import { Inject, Injectable } from '@nestjs/common';
import {
  SERVICES_EVENT_TYPES,
  ServiceEnquiryStatusChangedPayloadSchema,
  type JsonValue,
} from '@apnatown/shared';
import {
  ENQUIRY_STATUS_TRANSITIONS,
  EnquiryDetailSchema,
  EnquiryInboxPageSchema,
  EnquiryStatusResultSchema,
  type EnquiryDetail,
  type EnquiryInboxPage,
  type EnquiryInboxQuery,
  type EnquiryStatusCommand,
  type EnquiryStatusResult,
} from '@apnatown/shared/services';
import {
  IDENTITY_CRYPTO,
  type IdentityCrypto,
} from '../../../shared/auth/crypto';
import { DomainError } from '../../../shared/errors/errors';
import {
  EVENT_FACTORY,
  type EventFactory,
} from '../../../shared/events/event-factory';
import { OUTBOX_WRITER, type OutboxWriter } from '../../../shared/events/ports';
import {
  CURSOR_CODEC,
  CursorCodec,
  type CursorBinding,
} from '../../../shared/pagination/cursor';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import {
  ENQUIRY_AGGREGATE as AGGREGATE,
  allowedStatuses,
  enquiryItemDto,
  enquiryPhoneContext as encryptionContext,
} from './enquiry-common';
import {
  EnquiryOwnerAccess,
  type EnquiryOwnerRequest,
} from './enquiry-owner-access';
import {
  ENQUIRY_REPOSITORY,
  type EnquiryRepository,
  type StoredEnquiry,
} from './enquiry-ports';

/**
 * Owner enquiry inbox (F-VD-016, F-PV-004; ST-enquiry). Reads and
 * transitions are scoped to the caller's own business; another business's
 * enquiry is indistinguishable from a missing one. Only the detail decrypts
 * the phone; events carry ids only.
 */
@Injectable()
export class EnquiryInboxService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(ENQUIRY_REPOSITORY) private readonly enquiries: EnquiryRepository,
    @Inject(IDENTITY_CRYPTO) private readonly crypto: IdentityCrypto,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    @Inject(EVENT_FACTORY) private readonly events: EventFactory,
    @Inject(OUTBOX_WRITER) private readonly outbox: OutboxWriter,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly access: EnquiryOwnerAccess,
  ) {}

  /** Owner inbox with per-status counts for the same owner and query. */
  inbox(
    request: EnquiryOwnerRequest,
    input: EnquiryInboxQuery,
  ): Promise<EnquiryInboxPage> {
    return this.uow.run(async (tx) => {
      const business = await this.access.resolve(tx, request);
      const binding: CursorBinding = {
        operation: 'services.enquiries.inbox',
        sort: 'createdAt-desc-id-desc',
        filters: { status: input.status ?? null, query: input.query ?? null },
        scope: { businessId: business.id },
      };
      const after = this.position(input.cursor, binding);
      const filter = input.query ? { query: input.query } : {};
      const rows = await this.enquiries.page(tx, {
        businessId: business.id,
        ...(input.status ? { status: input.status } : {}),
        ...filter,
        ...(after ? { after } : {}),
        limit: input.limit,
      });
      const statusCounts = await this.enquiries.statusCounts(tx, {
        businessId: business.id,
        ...filter,
      });
      const page = rows.slice(0, input.limit);
      const last = page.at(-1);
      return EnquiryInboxPageSchema.parse({
        items: page.map(enquiryItemDto),
        nextCursor:
          rows.length > input.limit && last
            ? this.cursors.encode(binding, [
                last.createdAt.toISOString(),
                last.id,
              ])
            : null,
        statusCounts,
      });
    });
  }

  /** Owner detail with the decrypted phone for user-initiated contact links. */
  detail(
    request: EnquiryOwnerRequest,
    enquiryId: string,
  ): Promise<EnquiryDetail> {
    return this.uow.run(async (tx) => {
      const business = await this.access.resolve(tx, request);
      const row = await this.enquiries.find(tx, {
        businessId: business.id,
        enquiryId,
      });
      if (!row) throw new DomainError('COMMON_NOT_FOUND');
      return this.detailDto(row);
    });
  }

  /** Versioned strict ST-enquiry transition with outbox events. */
  transition(
    request: EnquiryOwnerRequest & { correlationId: string },
    enquiryId: string,
    input: EnquiryStatusCommand,
  ): Promise<EnquiryStatusResult> {
    return this.uow.run(async (tx) => {
      const business = await this.access.resolve(tx, request);
      const current = await this.enquiries.find(tx, {
        businessId: business.id,
        enquiryId,
        lock: true,
      });
      if (!current) throw new DomainError('COMMON_NOT_FOUND');
      if (current.version !== input.expectedVersion)
        throw new DomainError('SERVICES_VERSION_CONFLICT');
      if (!ENQUIRY_STATUS_TRANSITIONS[current.status].includes(input.status))
        throw new DomainError('SERVICES_INVALID_TRANSITION');
      const after = await this.enquiries.transition(tx, {
        businessId: business.id,
        enquiryId,
        from: current.status,
        to: input.status,
        expectedVersion: input.expectedVersion,
        at: this.clock.now(),
      });
      if (!after) throw new DomainError('SERVICES_VERSION_CONFLICT');
      const payload = ServiceEnquiryStatusChangedPayloadSchema.parse({
        enquiryId: after.id,
        businessId: after.businessId,
        serviceId: after.serviceId,
        ...(after.customerUserId
          ? { customerUserId: after.customerUserId }
          : {}),
        status: after.status,
        previousStatus: current.status,
        version: after.version,
      }) as JsonValue;
      const aggregate = {
        type: AGGREGATE,
        id: after.id,
        version: after.version,
      };
      await this.outbox.append(
        tx,
        this.events.create(
          SERVICES_EVENT_TYPES.enquiryStatusChanged,
          aggregate,
          payload,
          request.correlationId,
        ),
      );
      if (after.status === 'converted')
        await this.outbox.append(
          tx,
          this.events.create(
            SERVICES_EVENT_TYPES.enquiryConverted,
            aggregate,
            payload,
            request.correlationId,
          ),
        );
      return EnquiryStatusResultSchema.parse({
        enquiryId: after.id,
        status: after.status,
        previousStatus: current.status,
        version: after.version,
        convertedAt: after.convertedAt?.toISOString() ?? null,
        updatedAt: after.updatedAt.toISOString(),
        allowedStatuses: allowedStatuses(after.status),
      });
    });
  }

  private detailDto(row: StoredEnquiry): EnquiryDetail {
    return EnquiryDetailSchema.parse({
      ...enquiryItemDto(row),
      phone: this.crypto.decrypt(
        row.phoneCiphertext,
        encryptionContext(row.id),
      ),
      convertedAt: row.convertedAt?.toISOString() ?? null,
      updatedAt: row.updatedAt.toISOString(),
      allowedStatuses: allowedStatuses(row.status),
    });
  }

  private position(
    cursor: string | undefined,
    binding: CursorBinding,
  ): { createdAt: string; id: string } | undefined {
    if (!cursor) return undefined;
    const [createdAt, id] = this.cursors.decode(cursor, binding);
    if (typeof createdAt !== 'string' || typeof id !== 'string')
      throw new DomainError('COMMON_VALIDATION_FAILED');
    return { createdAt, id };
  }
}
