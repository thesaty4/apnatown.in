import type { ExploreSelection } from '../application/explore.repository';
import { Prisma } from '../../../shared/persistence/generated/client';
import { DomainError } from '../../../shared/errors/errors';

export type Term = { column: Prisma.Sql; descending: boolean; cast: 'float8' | 'bigint' | 'timestamptz' | 'uuid' };
export function exploreOrder(selection: ExploreSelection, after?: string[]) {
  const terms = sortTerms(selection);
  terms.push({ column: Prisma.sql`x.id`, descending: selection.filters.sort === 'newest', cast: 'uuid' });
  return keysetOrder(terms, after);
}
export function keysetOrder(terms: Term[], after?: string[]) {
  if (after && (after.length !== terms.length || after.some((value, i) =>
    value !== '~' && !validValue(value, terms[i]!.cast)))) throw new DomainError('COMMON_VALIDATION_FAILED');
  const order = Prisma.join(terms.map((t) => Prisma.sql`${t.column}
    ${t.descending ? Prisma.sql`DESC` : Prisma.sql`ASC`} NULLS LAST`));
  const keys = Prisma.sql`jsonb_build_array(${Prisma.join(terms.map((t) => t.cast === 'timestamptz'
    ? Prisma.sql`to_char(${t.column} AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`
    : Prisma.sql`coalesce(${t.column}::text,'~')`))})`;
  if (!after) return { order, keys, predicate: Prisma.sql`true` };
  const values = terms.map((t, i) => Prisma.sql`${after[i] === '~' ? null : after[i]}::${Prisma.raw(t.cast)}`);
  const branches = terms.map((term, i) => {
    const equal = terms.slice(0, i).map((prior, j) => Prisma.sql`${prior.column} IS NOT DISTINCT FROM ${values[j]}`);
    const compare = after[i] === '~' ? Prisma.sql`false` : Prisma.sql`(
      ${term.column} ${term.descending ? Prisma.sql`<` : Prisma.sql`>`} ${values[i]} OR ${term.column} IS NULL)`;
    return Prisma.sql`(${Prisma.join([...equal, compare], ' AND ')})`;
  });
  return { order, keys, predicate: Prisma.sql`(${Prisma.join(branches, ' OR ')})` };
}
function sortTerms({ filters, location }: ExploreSelection): Term[] {
  const asc = (column: Prisma.Sql, cast: Term['cast'] = 'float8'): Term => ({ column, cast, descending: false });
  const desc = (column: Prisma.Sql, cast: Term['cast'] = 'float8'): Term => ({ column, cast, descending: true });
  switch (filters.sort) {
    case 'price_asc': return [asc(Prisma.sql`x.price_paise`, 'bigint')];
    case 'price_desc': return [desc(Prisma.sql`x.price_paise`, 'bigint')];
    case 'rating': return [desc(Prisma.sql`x.rating`)];
    case 'distance': return [asc(Prisma.sql`x.distance_km`)];
    case 'newest': return [desc(Prisma.sql`x.created_at`, 'timestamptz')];
    default: return [
      asc(Prisma.sql`CASE WHEN x.featured THEN 0 ELSE 1 END`, 'bigint'),
      ...(filters.tab === 'services' ? [asc(Prisma.sql`CASE WHEN x.offers THEN 0 ELSE 1 END`, 'bigint')] : []),
      ...(location ? [asc(Prisma.sql`x.distance_km`)] : []),
    ];
  }
}
function validValue(value: string, cast: Term['cast']): boolean {
  if (cast === 'uuid') return /^[a-f0-9-]{36}$/i.test(value);
  if (cast === 'timestamptz') return /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{6}Z$/.test(value);
  return /^(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(value);
}
