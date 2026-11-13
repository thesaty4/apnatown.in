import { Injectable } from '@nestjs/common';
import type {
  EnquiryStatus,
  EnquiryStatusCounts,
} from '@apnatown/shared/services';
import { Prisma } from '../../../shared/persistence/generated/client';
import { PrismaDatabase } from '../../../shared/persistence/prisma-database';
import type { TxContext } from '../../../shared/persistence/ports';
import type {
  EnquirableService,
  EnquiryInboxRow,
  EnquiryPosition,
  EnquiryRepository,
  StoredEnquiry,
} from '../application/enquiry-ports';

const likePattern = (q: string) => `%${q.replace(/[\\%_]/g, '\\$&')}%`;

const inboxColumns = Prisma.sql`
  e.id::text AS id,e.service_id::text AS "serviceId",s.slug AS "serviceSlug",
  s.name_en AS "serviceNameEn",s.name_hi AS "serviceNameHi",
  e.business_id::text AS "businessId",e.customer_user_id::text AS "customerUserId",
  e.name,e.message,e.preferred_date::text AS "preferredDate",e.status,e.version,
  e.converted_at AS "convertedAt",e.created_at AS "createdAt",e.updated_at AS "updatedAt"`;

function textFilter(query: string | undefined): Prisma.Sql {
  if (!query) return Prisma.empty;
  const pattern = likePattern(query);
  return Prisma.sql`AND (e.name ILIKE ${pattern} ESCAPE '\\'
    OR e.message ILIKE ${pattern} ESCAPE '\\')`;
}

/** Parameterized SQL only; Services owns `enquiries` and `services`. */
@Injectable()
export class PrismaEnquiryRepository implements EnquiryRepository {
  constructor(private readonly db: PrismaDatabase) {}

  async enquirableService(
    tx: TxContext,
    serviceId: string,
  ): Promise<EnquirableService | null> {
    // services_public_discovery: active, non-deleted service of a publicly
    // visible approved business under an active service-kind taxonomy.
    const rows = await this.db.client(tx).$queryRaw<EnquirableService[]>`
      SELECT id::text AS "serviceId",business_id::text AS "businessId"
      FROM services_public_discovery WHERE id=${serviceId}::uuid`;
    return rows[0] ?? null;
  }

  async insert(
    tx: TxContext,
    input: Parameters<EnquiryRepository['insert']>[1],
  ): Promise<void> {
    await this.db.client(tx).$executeRaw`
      INSERT INTO enquiries (id,service_id,business_id,customer_user_id,name,
        phone_ciphertext,message,preferred_date,status,version,created_at,updated_at)
      VALUES (${input.id}::uuid,${input.serviceId}::uuid,${input.businessId}::uuid,
        ${input.customerUserId}::uuid,${input.name},${input.phoneCiphertext},
        ${input.message},${input.preferredDate}::date,'new',1,${input.at},${input.at})`;
  }

  page(
    tx: TxContext,
    input: {
      businessId: string;
      status?: EnquiryStatus;
      query?: string;
      after?: EnquiryPosition;
      limit: number;
    },
  ): Promise<EnquiryInboxRow[]> {
    const status = input.status
      ? Prisma.sql`AND e.status=${input.status}`
      : Prisma.empty;
    const after = input.after
      ? Prisma.sql`AND (e.created_at,e.id) < (${input.after.createdAt}::timestamptz,${input.after.id}::uuid)`
      : Prisma.empty;
    return this.db.client(tx).$queryRaw<EnquiryInboxRow[]>`
      SELECT ${inboxColumns}
      FROM enquiries e JOIN services s ON s.id=e.service_id
      WHERE e.business_id=${input.businessId}::uuid ${status}
        ${textFilter(input.query)} ${after}
      ORDER BY e.created_at DESC,e.id DESC
      LIMIT ${input.limit + 1}`;
  }

  async statusCounts(
    tx: TxContext,
    input: { businessId: string; query?: string },
  ): Promise<EnquiryStatusCounts> {
    const rows = await this.db.client(tx).$queryRaw<
      { status: EnquiryStatus; count: number }[]
    >`
      SELECT e.status,count(*)::int AS count FROM enquiries e
      WHERE e.business_id=${input.businessId}::uuid ${textFilter(input.query)}
      GROUP BY e.status`;
    const counts: EnquiryStatusCounts = {
      new: 0,
      contacted: 0,
      converted: 0,
      closed: 0,
    };
    for (const row of rows) counts[row.status] = row.count;
    return counts;
  }

  async find(
    tx: TxContext,
    input: { businessId: string; enquiryId: string; lock?: boolean },
  ): Promise<StoredEnquiry | null> {
    const rows = await this.db.client(tx).$queryRaw<StoredEnquiry[]>`
      SELECT ${inboxColumns},e.phone_ciphertext AS "phoneCiphertext"
      FROM enquiries e JOIN services s ON s.id=e.service_id
      WHERE e.id=${input.enquiryId}::uuid
        AND e.business_id=${input.businessId}::uuid
      ${input.lock ? Prisma.sql`FOR UPDATE OF e` : Prisma.empty}`;
    return rows[0] ?? null;
  }

  async transition(
    tx: TxContext,
    input: {
      businessId: string;
      enquiryId: string;
      from: EnquiryStatus;
      to: EnquiryStatus;
      expectedVersion: number;
      at: Date;
    },
  ): Promise<StoredEnquiry | null> {
    const converted =
      input.to === 'converted'
        ? Prisma.sql`COALESCE(converted_at,${input.at})`
        : Prisma.sql`converted_at`;
    const updated = await this.db.client(tx).$queryRaw<{ id: string }[]>`
      UPDATE enquiries
      SET status=${input.to},version=version+1,converted_at=${converted},
        updated_at=${input.at}
      WHERE id=${input.enquiryId}::uuid
        AND business_id=${input.businessId}::uuid
        AND status=${input.from}
        AND version=${input.expectedVersion}
      RETURNING id::text AS id`;
    if (!updated[0]) return null;
    return this.find(tx, {
      businessId: input.businessId,
      enquiryId: input.enquiryId,
    });
  }
}
