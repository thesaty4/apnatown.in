import { Inject, Injectable } from '@nestjs/common';
import {
  SERVICES_EVENT_TYPES,
  ServiceEnquiryCreatedPayloadSchema,
  type JsonValue,
} from '@apnatown/shared';
import {
  EnquiryCreatedSchema,
  type EnquiryCreate,
  type EnquiryCreated,
} from '@apnatown/shared/services';
import { normalizePhone } from '@apnatown/shared/users';
import type { SessionBinding } from '../../../shared/auth';
import {
  IDENTITY_CRYPTO,
  type IdentityCrypto,
} from '../../../shared/auth/crypto';
import { SESSION_ACCESS, type SessionAccess } from '../../../shared/auth/ports';
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
} from '../../../shared/persistence/ports';
import {
  CLOCK,
  ID_PROVIDER,
  type Clock,
  type IdProvider,
} from '../../../shared/runtime/providers';
import {
  ENQUIRY_AGGREGATE as AGGREGATE,
  enquiryPhoneContext as encryptionContext,
} from './enquiry-common';
import { ENQUIRY_REPOSITORY, type EnquiryRepository } from './enquiry-ports';

/** Guest (anonymous session) or signed-in enquirer. */
export interface EnquirySubmission {
  session: SessionBinding;
  principalId: string | null;
  correlationId: string;
  key: unknown;
}

const istDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Public enquiry intake (F-SV-005; ST-enquiry, BR-09/BR-14). Needs an active
 * service of a publicly visible approved business; idempotent per session or
 * principal. The phone is encrypted at rest and events carry ids only.
 */
@Injectable()
export class EnquiryCreateService {
  constructor(
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY)
    private readonly contexts: HttpCommandContextFactory,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(ENQUIRY_REPOSITORY) private readonly enquiries: EnquiryRepository,
    @Inject(IDENTITY_CRYPTO) private readonly crypto: IdentityCrypto,
    @Inject(EVENT_FACTORY) private readonly events: EventFactory,
    @Inject(OUTBOX_WRITER) private readonly outbox: OutboxWriter,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
  ) {}

  /** POST /services/{serviceId}/enquiries: guest or signed-in, idempotent, 201. */
  create(
    request: EnquirySubmission,
    serviceId: string,
    input: EnquiryCreate,
  ): Promise<EnquiryCreated> {
    const now = this.clock.now();
    const preferredDate = input.preferredDate ?? null;
    // Calendar dates compare lexically as YYYY-MM-DD.
    if (preferredDate !== null && preferredDate < istDate.format(now))
      throw new DomainError('VALIDATION_ERROR', { field: 'preferredDate' });
    const phone = normalizePhone(input.phone);
    const command = this.contexts.create(
      {
        name: 'services.enquiries.create',
        method: 'POST',
        scope: 'principal',
        successStatus: 201,
      },
      {
        // Anonymous guests are keyed by their live session.
        actorId: request.principalId ?? request.session.id,
        correlationId: request.correlationId,
        resource: `/services/${serviceId}/enquiries`,
        business: null,
        expiresAt: new Date(now.getTime() + RECEIPT_TTL_MS),
      },
      {
        key: request.key,
        // Hashed into the request fingerprint only; never stored or logged.
        payload: {
          name: input.name,
          phone,
          message: input.message,
          preferredDate,
        },
      },
    );
    return this.commands.run(
      command,
      async (tx) => {
        let customerUserId: string | null = null;
        if (request.principalId) {
          // Revalidate the session/identity through commit.
          const principal = await this.sessions.requirePrincipal(
            tx,
            request.session,
          );
          if (principal.userId !== request.principalId)
            throw new DomainError('SESSION_EXPIRED');
          customerUserId = principal.userId;
        }
        const service = await this.enquiries.enquirableService(tx, serviceId);
        if (!service) throw new DomainError('COMMON_NOT_FOUND');
        const id = this.ids.uuidv7();
        await this.enquiries.insert(tx, {
          id,
          serviceId: service.serviceId,
          businessId: service.businessId,
          customerUserId,
          name: input.name,
          phoneCiphertext: this.crypto.encrypt(phone, encryptionContext(id)),
          message: input.message,
          preferredDate,
          at: this.clock.now(),
        });
        await this.outbox.append(
          tx,
          this.events.create(
            SERVICES_EVENT_TYPES.enquiryCreated,
            { type: AGGREGATE, id, version: 1 },
            ServiceEnquiryCreatedPayloadSchema.parse({
              enquiryId: id,
              businessId: service.businessId,
              serviceId: service.serviceId,
              ...(customerUserId ? { customerUserId } : {}),
            }) as JsonValue,
            request.correlationId,
          ),
        );
        return EnquiryCreatedSchema.parse({
          enquiryId: id,
          status: 'new',
        }) as EnquiryCreated & JsonValue;
      },
      {
        store: (result) => result,
        replay: (_tx, stored) =>
          Promise.resolve(
            EnquiryCreatedSchema.parse(stored) as EnquiryCreated & JsonValue,
          ),
      },
    );
  }
}
