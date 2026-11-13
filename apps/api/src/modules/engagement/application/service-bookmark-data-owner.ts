import { Inject, Injectable } from '@nestjs/common';
import { ServiceBookmarkExportSchema } from '@apnatown/shared/users';
import { IdSchema, TimestampSchema } from '@apnatown/shared/wire';
import { z } from 'zod';
import type { TxContext } from '../../../shared/persistence/ports';
import type { UserDataPort, UserDataExportPage, UserDataErasure } from '../../users/application/user-data-port';
import { SERVICE_BOOKMARK_REPOSITORY, type ServiceBookmarkRepository } from '../domain/bookmarks';

const position = z.string().transform((value) => value.split('|')).pipe(z.tuple([TimestampSchema,IdSchema]));
@Injectable()
export class ServiceBookmarkDataOwner implements UserDataPort {
  readonly section = 'bookmarks' as const;
  constructor(@Inject(SERVICE_BOOKMARK_REPOSITORY) private readonly bookmarks: ServiceBookmarkRepository) {}
  async exportPage(input: { userId: string; cursor: string | null; limit: number }, tx: TxContext): Promise<UserDataExportPage> {
    const limit = Math.min(50,Math.max(1,input.limit));
    const after = input.cursor === null ? null : position.parse(input.cursor);
    const rows = await this.bookmarks.page(tx,{
      userId: input.userId,limit,...(after ? { after: { createdAt: after[0],targetId: after[1] } } : {}),
    });
    const page = rows.slice(0,limit);
    const last = page.at(-1);
    return {
      items: page.map((row) => ServiceBookmarkExportSchema.parse(row)),
      nextCursor: rows.length>limit && last ? `${last.createdAt}|${last.targetId}` : null,
    };
  }
  async erase(input: { userId: string; requestId: string; policyVersion: string }, tx: TxContext): Promise<UserDataErasure> {
    // Users authorizes the deletion policy and marks deleting before invoking
    // owner ports. The request receipt and erasure commit in the same UoW.
    await this.bookmarks.eraseForUser(tx,input.userId);
    return { receipt: `engagement.bookmarks:${input.requestId}`,status: 'completed' };
  }
}
