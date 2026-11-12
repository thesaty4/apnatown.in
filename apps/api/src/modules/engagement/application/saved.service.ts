import { Inject, Injectable } from '@nestjs/common';
import { SavedPageSchema, type SavedQuery } from '@apnatown/shared';
import { IdSchema, TimestampSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import {
  SESSION_ACCESS,
  type SessionAccess,
  type SessionBinding,
} from '../../../shared/auth/ports';
import { DomainError } from '../../../shared/errors/errors';
import {
  CURSOR_CODEC,
  type CursorCodec,
  type CursorBinding,
} from '../../../shared/pagination/cursor';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '../../../shared/persistence/ports';
import {
  BUSINESS_SAVED_CARDS,
  type BusinessSavedCards,
} from '../../businesses/application/business-saved-cards';
import {
  VIDEO_SAVED_CARDS,
  type VideoSavedCards,
} from '../../media-videos/application/video-saved-cards';
import { SAVED_REPOSITORY, type SavedRepository } from '../domain/saved';
import { SERVICE_SAVED_CARDS, type ServiceSavedCards } from '../../services/application/service-saved-cards';

const positionSchema = z.tuple([TimestampSchema, IdSchema]);

@Injectable()
export class SavedService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(CURSOR_CODEC) private readonly cursors: CursorCodec,
    @Inject(SAVED_REPOSITORY) private readonly saved: SavedRepository,
    @Inject(BUSINESS_SAVED_CARDS)
    private readonly businesses: BusinessSavedCards,
    @Inject(VIDEO_SAVED_CARDS) private readonly videos: VideoSavedCards,
    @Inject(SERVICE_SAVED_CARDS) private readonly services: ServiceSavedCards,
  ) {}

  list(session: SessionBinding, query: SavedQuery) {
    return this.uow.run(async (tx) => {
      const principal = await this.sessions.requirePrincipal(tx, session);
      if (!principal.roles.includes('customer'))
        throw new DomainError('COMMON_FORBIDDEN');
      const binding: CursorBinding = {
        operation: 'engagement.saved',
        sort: 'savedAt-targetId-desc',
        filters: { tab: query.tab, mediaFilter: query.mediaFilter },
        scope: { actor: principal.userId },
      };
      const position = query.cursor
        ? positionSchema.safeParse(this.cursors.decode(query.cursor, binding))
        : null;
      if (position && !position.success)
        throw new DomainError('VALIDATION_ERROR', { field: 'cursor' });
      const after = position?.success
        ? { savedAt: position.data[0], targetId: position.data[1] }
        : undefined;
      const rows = await this.saved.page(tx, {
        userId: principal.userId,
        query,
        ...(after && { after }),
      });
      const page = rows.slice(0, query.limit);
      const ids = page.map((row) => row.targetId);
      const cards =
        query.tab === 'shops'
          ? (await this.businesses.cards(tx, ids)).map((card) => ({
              ...card,
              canonicalPath: null,
            }))
          : query.tab === 'services'
          ? await this.services.cards(tx,ids)
          : (await this.videos.cards(tx, ids)).map((card) => ({
              id: card.id,
              labelEn: card.caption,
              labelHi: null,
              canonicalPath: `/videos/${card.id}`,
            }));
      const byId = new Map(cards.map((card) => [card.id, card]));
      const last = page.at(-1);
      return SavedPageSchema.parse({
        items: page.map((row) => {
          const card = byId.get(row.targetId);
          return card
            ? {
                ...row,
                available: true,
                labelEn: card.labelEn,
                labelHi: card.labelHi,
                canonicalPath: card.canonicalPath,
              }
            : {
                ...row,
                available: false,
                reasonKey: 'engagement.saved.unavailable',
              };
        }),
        nextCursor:
          rows.length > query.limit && last
            ? this.cursors.encode(binding, [last.savedAt, last.targetId])
            : null,
      });
    });
  }
}
