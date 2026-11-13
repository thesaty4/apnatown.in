import { Injectable } from '@nestjs/common';
import { EXPLORE_TABS, type ExploreResponse } from '@apnatown/shared/search';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import { listingCard, listingPin, listingRows } from '../../../shared/persistence/public-listing-sql';
import { productPublicProjection } from '../../products/infrastructure/public-projection';
import { servicePublicProjection } from '../../services/infrastructure/public-projection';
import { businessPublicProjection } from '../../businesses/infrastructure/public-projection';
import type { ExploreRepository, ExploreSelection, ExploreSnapshot, ExploreRow } from '../application/explore.repository';
import { discoveryContext } from './explore-context';
import { exploreFacets } from './explore-facets';
import { exploreOrder } from './explore-ordering';
import { explorePredicate } from './explore-predicate';
import type { TxContext } from '../../../shared/persistence/ports';

export const discoverySources = Prisma.sql`${productPublicProjection} UNION ALL ${businessPublicProjection} UNION ALL ${servicePublicProjection}`;
export const discoveryRows = (selection: ExploreSelection) => listingRows(discoverySources,selection.location);

@Injectable()
export class PrismaExploreRepository implements ExploreRepository {
  constructor(private readonly db: PrismaDatabase) {}
  snapshot<T>(work: (snapshot: ExploreSnapshot) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => {
      const client = this.db.client(tx);
      await client.$executeRaw`SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY`;
      return work(exploreSnapshot(client, tx));
    });
  }
}

/** One transaction-bound query engine shared by Search and Explore. */
export function exploreSnapshot(client: Prisma.TransactionClient, tx: TxContext): ExploreSnapshot {
  return {
    tx,
    context: (filters,location) => discoveryContext(client,filters,location),
    revision: () => revision(client),
    page: (selection,limit,after) => page(client,selection,limit,after),
    counts: (selection) => counts(client,selection),
    facets: (selection) => exploreFacets(client,discoveryRows(selection),selection),
  };
}
async function revision(client: Prisma.TransactionClient): Promise<string> {
    // Current effective public projection (not a copied index): expiry, repricing,
    // moderation and hours boundaries invalidate old signed ordering contexts.
    const [row] = await client.$queryRaw<{ revision: string }[]>(Prisma.sql`
      SELECT md5(coalesce(string_agg(digest,'' ORDER BY kind,id),'')) AS revision FROM (
        SELECT x.kind,x.id,md5(row_to_json(x)::text || row_to_json(b)::text) AS digest
        FROM (${discoverySources}) x JOIN businesses_public_context b ON b.id=x.business_id
      ) revisions`);
    return row!.revision;
  }
function page(client: Prisma.TransactionClient, selection: ExploreSelection, limit: number, after?: string[]) {
    const ordering = exploreOrder(selection,after);
    return client.$queryRaw<ExploreRow[]>(Prisma.sql`WITH base AS MATERIALIZED (${discoveryRows(selection)})
      SELECT ${listingCard} AS card,${listingPin} AS pin,${ordering.keys} AS keys
      FROM base x WHERE ${explorePredicate(selection,selection.filters.tab)} AND ${ordering.predicate}
      ORDER BY ${ordering.order} LIMIT ${limit + 1}`);
  }
async function counts(client: Prisma.TransactionClient, selection: ExploreSelection): Promise<ExploreResponse['counts']> {
    const [row] = await client.$queryRaw<ExploreResponse['counts'][]>(Prisma.sql`
      WITH base AS MATERIALIZED (${discoveryRows(selection)})
      SELECT ${Prisma.join(EXPLORE_TABS.map((tab) => Prisma.sql`
        count(*) FILTER(WHERE ${explorePredicate(selection,tab)})::integer AS ${Prisma.raw(tab)}`))}
      FROM base x`);
    return row!;
}
