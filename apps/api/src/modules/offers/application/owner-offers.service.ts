import { Inject, Injectable } from '@nestjs/common';
import {
  OwnerOfferPageSchema,
  OwnerOfferSchema,
  type OfferCreate,
  type OfferStatusCommand,
  type OfferUpdate,
  type OwnerOffer,
  type OwnerOfferPage,
  type OwnerOfferQuery,
} from '@apnatown/shared/offers';
import { IdSchema, TimestampSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import { DomainError } from '../../../shared/errors/errors';
import { COMMAND_CONTEXT_FACTORY, type HttpCommandContextFactory } from '../../../shared/idempotency/context';
import { ownerCommandContext, type OwnerCommandRequest } from '../../../shared/idempotency/owner-command';
import { CURSOR_CODEC, type CursorCodec } from '../../../shared/pagination/cursor';
import {
  COMMAND_UNIT_OF_WORK,
  UNIT_OF_WORK,
  type CommandUnitOfWork,
  type TxContext,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import { CLOCK, ID_PROVIDER, type Clock, type IdProvider } from '../../../shared/runtime/providers';
import {
  ApprovedSellerAccess,
  type SellerRequest,
} from '../../businesses/application/approved-seller-access';
import { receipt } from '../../catalog/application/catalog-mappers';
import {
  OWNER_OFFER_REPOSITORY,
  STATUS_ACTION,
  allowedActions,
  type OwnerOfferRepository,
  type StoredOffer,
} from '../domain/owner-offers';

const position = z.tuple([TimestampSchema, IdSchema]);

/**
 * S-VEND-07 owner offers (F-VD-007, F-OF-005): own approved business only.
 * Create and every edit enter pending approval; status commands follow the
 * owner transitions in `allowedActions`. Never client-addressed business.
 */
@Injectable()
export class OwnerOffersService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(COMMAND_UNIT_OF_WORK) private readonly commands: CommandUnitOfWork,
    @Inject(COMMAND_CONTEXT_FACTORY) private readonly contexts: HttpCommandContextFactory,
    @Inject(OWNER_OFFER_REPOSITORY) private readonly offers: OwnerOfferRepository,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_PROVIDER) private readonly ids: IdProvider,
    private readonly sellers: ApprovedSellerAccess,
  ) {}

  page(request: SellerRequest, query: OwnerOfferQuery): Promise<OwnerOfferPage> {
    return this.uow.run(async (tx) => {
      const business = await this.sellers.resolve(tx, request);
      const binding = {
        operation: 'offers.owner.list',
        sort: 'recent',
        filters: { status: query.status },
        scope: business.id,
      };
      let after = null;
      if (query.cursor) {
        const parsed = position.safeParse(this.cursors.decode(query.cursor, binding));
        if (!parsed.success) throw new DomainError('VALIDATION_ERROR');
        after = { createdAt: parsed.data[0], id: parsed.data[1] };
      }
      const rows = await this.offers.page(tx, {
        businessId: business.id,
        status: query.status === 'all' ? null : query.status,
        take: query.limit + 1,
        after,
      });
      const items = rows.slice(0, query.limit);
      const last = items.at(-1);
      return OwnerOfferPageSchema.parse({
        items: items.map((row) => this.dto(row)),
        nextCursor:
          rows.length > query.limit && last
            ? this.cursors.encode(binding, [last.createdAt, last.id])
            : null,
      });
    });
  }

  create(request: SellerRequest & OwnerCommandRequest, input: OfferCreate): Promise<OwnerOffer> {
    return this.commands.run(
      ownerCommandContext(
        this.contexts,
        this.clock,
        request,
        { name: 'offers.owner.create', resource: '/businesses/me/offers', successStatus: 201 },
        input,
      ),
      async (tx) => {
        const business = await this.sellers.resolve(tx, request);
        const id = this.ids.uuidv7();
        await this.offers.insert(tx, { ...input, id, businessId: business.id, at: this.clock.now() });
        return this.read(tx, id, business.id);
      },
      receipt(OwnerOfferSchema),
    );
  }

  update(request: SellerRequest, id: string, input: OfferUpdate): Promise<OwnerOffer> {
    return this.uow.run(async (tx) => {
      const { business } = await this.current(tx, request, id, input.expectedVersion, 'edit');
      const { expectedVersion, ...fields } = input;
      if (!(await this.offers.update(tx, { ...fields, id, businessId: business, expectedVersion, at: this.clock.now() })))
        throw new DomainError('OFFER_VERSION_CONFLICT');
      return this.read(tx, id, business);
    });
  }

  setStatus(request: SellerRequest, id: string, input: OfferStatusCommand): Promise<OwnerOffer> {
    return this.uow.run(async (tx) => {
      const { business } = await this.current(tx, request, id, input.expectedVersion, STATUS_ACTION[input.status]);
      if (
        !(await this.offers.setStatus(tx, {
          id,
          businessId: business,
          status: input.status,
          expectedVersion: input.expectedVersion,
          at: this.clock.now(),
        }))
      )
        throw new DomainError('OFFER_VERSION_CONFLICT');
      return this.read(tx, id, business);
    });
  }

  /** Locked own offer at the expected version that permits `action`. */
  private async current(
    tx: TxContext,
    request: SellerRequest,
    id: string,
    expectedVersion: number,
    action: ReturnType<typeof allowedActions>[number],
  ) {
    const business = await this.sellers.resolve(tx, request);
    const offer = await this.offers.find(tx, { id, businessId: business.id, lock: true });
    if (!offer) throw new DomainError('OFFER_NOT_FOUND');
    if (offer.version !== expectedVersion) throw new DomainError('OFFER_VERSION_CONFLICT');
    if (!allowedActions(offer, this.clock.now()).includes(action))
      throw new DomainError('OFFER_STATE_INVALID');
    return { business: business.id, offer };
  }

  private async read(tx: TxContext, id: string, businessId: string): Promise<OwnerOffer> {
    const row = await this.offers.find(tx, { id, businessId, lock: false });
    if (!row) throw new DomainError('OFFER_NOT_FOUND');
    return this.dto(row);
  }

  private dto(row: StoredOffer): OwnerOffer {
    const now = this.clock.now();
    const { businessId: _business, createdAt: _created, ...fields } = row;
    return OwnerOfferSchema.parse({
      ...fields,
      expired: Date.parse(row.validTo) <= now.getTime(),
      allowedActions: allowedActions(row, now),
    });
  }
}
