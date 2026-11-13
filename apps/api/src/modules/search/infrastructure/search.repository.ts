import { Injectable } from '@nestjs/common';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { SearchRepository, SearchSnapshot } from '../application/search.repository';
import { exploreSnapshot } from './explore.repository';
import { searchTaxonomy } from './search-taxonomy';
import { searchVideoCount, searchVideoPage, searchVideoRevision } from './search-videos';

@Injectable()
export class PrismaSearchRepository implements SearchRepository {
  constructor(private readonly db: PrismaDatabase) {}
  snapshot<T>(work: (snapshot: SearchSnapshot) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => {
      const client = this.db.client(tx);
      await client.$executeRaw`SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY`;
      const listings = exploreSnapshot(client, tx);
      return work({
        ...listings,
        revision: async () => `${await listings.revision()}:${await searchVideoRevision(client)}`,
        videoCount: (selection) => searchVideoCount(client, selection),
        videoPage: (selection, limit, after) => searchVideoPage(client, selection, limit, after),
        taxonomySuggestions: (selection) => searchTaxonomy(client, selection),
      });
    });
  }
}
