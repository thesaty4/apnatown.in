import { Inject, Injectable } from '@nestjs/common';
import type { ServiceBookmarkResult } from '@apnatown/shared';
import { SESSION_ACCESS, type SessionAccess, type SessionBinding } from '../../../shared/auth/ports';
import { UNIT_OF_WORK, type UnitOfWork } from '../../../shared/persistence/ports';
import { CLOCK, type Clock } from '../../../shared/runtime/providers';
import { DomainError } from '../../../shared/errors/errors';
import { SERVICE_SAVED_CARDS, type ServiceSavedCards } from '../../services/application/service-saved-cards';
import { SERVICE_BOOKMARK_REPOSITORY, type ServiceBookmarkRepository } from '../domain/bookmarks';

@Injectable()
export class ServiceBookmarksService {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(SESSION_ACCESS) private readonly sessions: SessionAccess,
    @Inject(SERVICE_SAVED_CARDS) private readonly services: ServiceSavedCards,
    @Inject(SERVICE_BOOKMARK_REPOSITORY) private readonly bookmarks: ServiceBookmarkRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}
  set(session: SessionBinding, serviceId: string, bookmarked: boolean): Promise<ServiceBookmarkResult> {
    return this.uow.run(async (tx) => {
      const principal = await this.sessions.requirePrincipal(tx,session);
      if (!principal.roles.includes('customer')) throw new DomainError('COMMON_FORBIDDEN');
      if (bookmarked && !(await this.services.cards(tx,[serviceId])).length)
        throw new DomainError('ENGAGEMENT_TARGET_NOT_FOUND');
      // DELETE only scopes the caller's relationship; stale/deleted targets
      // must remain removable. PUT's PK makes retries naturally idempotent.
      await this.bookmarks.set(tx,{ userId: principal.userId,serviceId,bookmarked,at: this.clock.now() });
      return { bookmarked };
    });
  }
}
